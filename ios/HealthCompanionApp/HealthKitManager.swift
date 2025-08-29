import Foundation
import HealthKit
import CryptoKit
import BackgroundTasks

class HealthKitManager: ObservableObject {
    private let healthStore = HKHealthStore()
    private let keychain = KeychainManager()
    
    @Published var isAuthorized = false
    @Published var lastSyncDate: Date?
    @Published var syncStatus: SyncStatus = .idle
    
    enum SyncStatus {
        case idle
        case syncing
        case success
        case error(String)
    }
    
    private struct DeviceRegistration {
        let deviceId: String
        let hmacSecret: String
        let jwtToken: String
    }
    
    // MARK: - Health Connect Permissions
    
    private let readTypes: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
        HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
    ]
    
    func requestHealthKitPermission() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthError.healthKitNotAvailable
        }
        
        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
            await MainActor.run {
                self.isAuthorized = true
            }
        } catch {
            throw HealthError.permissionDenied
        }
    }
    
    // MARK: - Device Registration
    
    func registerDevice(jwtToken: String) async throws {
        let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        let deviceName = UIDevice.current.name
        let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        
        let registrationData: [String: Any] = [
            "deviceId": deviceId,
            "platform": "ios",
            "deviceName": deviceName,
            "appVersion": appVersion,
            "consents": [
                "steps": true,
                "heart_rate": true,
                "sleep": true,
                "calories": true
            ]
        ]
        
        let url = URL(string: "https://wehexulgoxwswkaoygnx.supabase.co/functions/v1/health-register-device")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(jwtToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let jsonData = try JSONSerialization.data(withJSONObject: registrationData)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw HealthError.registrationFailed
        }
        
        let result = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let hmacSecret = result?["hmacSecret"] as? String else {
            throw HealthError.invalidResponse
        }
        
        // Store registration data securely in Keychain
        keychain.store(key: "device_id", value: deviceId)
        keychain.store(key: "hmac_secret", value: hmacSecret)
        keychain.store(key: "jwt_token", value: jwtToken)
        keychain.store(key: "device_registered", value: "true")
        
        // Schedule background sync
        scheduleBackgroundSync()
    }
    
    // MARK: - Health Data Collection
    
    private func collectHealthData(from startDate: Date, to endDate: Date) async throws -> [[String: Any]] {
        var healthData: [[String: Any]] = []
        let calendar = Calendar.current
        
        var currentDate = startDate
        while currentDate <= endDate {
            let dayData = try await collectDayData(for: currentDate)
            if !dayData.isEmpty {
                healthData.append(dayData)
            }
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        return healthData
    }
    
    private func collectDayData(for date: Date) async throws -> [String: Any] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)
        
        // Collect all data types concurrently
        async let steps = getStepCount(predicate: predicate)
        async let heartRate = getAverageHeartRate(predicate: predicate)
        async let sleep = getSleepHours(for: date)
        async let calories = getActiveCalories(predicate: predicate)
        
        let (stepsCount, avgHeartRate, sleepHours, caloriesBurned) = try await (steps, heartRate, sleep, calories)
        
        var dayData: [String: Any] = [
            "date": ISO8601DateFormatter().string(from: date)
        ]
        
        if stepsCount > 0 { dayData["steps"] = stepsCount }
        if avgHeartRate > 0 { dayData["heart_rate"] = avgHeartRate }
        if sleepHours > 0 { dayData["sleep_hours"] = sleepHours }
        if caloriesBurned > 0 { dayData["calories"] = caloriesBurned }
        
        return dayData
    }
    
    private func getStepCount(predicate: NSPredicate) async throws -> Int {
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let steps = result?.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0
                continuation.resume(returning: Int(steps))
            }
            
            healthStore.execute(query)
        }
    }
    
    private func getAverageHeartRate(predicate: NSPredicate) async throws -> Int {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: heartRateType, quantitySamplePredicate: predicate, options: .discreteAverage) { _, result, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let heartRate = result?.averageQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: HKUnit.minute())) ?? 0
                continuation.resume(returning: Int(heartRate))
            }
            
            healthStore.execute(query)
        }
    }
    
    private func getSleepHours(for date: Date) async throws -> Double {
        let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!
        let calendar = Calendar.current
        
        // Sleep data typically spans overnight, so check from previous evening to next morning
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                guard let sleepSamples = samples as? [HKCategorySample] else {
                    continuation.resume(returning: 0.0)
                    return
                }
                
                let totalSleepTime = sleepSamples.reduce(0.0) { total, sample in
                    if sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue {
                        return total + sample.endDate.timeIntervalSince(sample.startDate)
                    }
                    return total
                }
                
                let sleepHours = totalSleepTime / 3600.0 // Convert seconds to hours
                continuation.resume(returning: sleepHours)
            }
            
            healthStore.execute(query)
        }
    }
    
    private func getActiveCalories(predicate: NSPredicate) async throws -> Int {
        let caloriesType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: caloriesType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let calories = result?.sumQuantity()?.doubleValue(for: HKUnit.kilocalorie()) ?? 0
                continuation.resume(returning: Int(calories))
            }
            
            healthStore.execute(query)
        }
    }
    
    // MARK: - Data Sync
    
    func syncHealthData() async {
        await MainActor.run {
            self.syncStatus = .syncing
        }
        
        do {
            guard let registration = getDeviceRegistration() else {
                throw HealthError.deviceNotRegistered
            }
            
            // Get data from last 7 days
            let endDate = Date()
            let startDate = Calendar.current.date(byAdding: .day, value: -7, to: endDate)!
            
            let healthData = try await collectHealthData(from: startDate, to: endDate)
            
            if healthData.isEmpty {
                await MainActor.run {
                    self.syncStatus = .success
                }
                return
            }
            
            // Prepare sync data
            let syncData: [String: Any] = [
                "deviceId": registration.deviceId,
                "platform": "ios",
                "window": [
                    "from": ISO8601DateFormatter().string(from: startDate),
                    "to": ISO8601DateFormatter().string(from: endDate)
                ],
                "data": healthData
            ]
            
            try await sendHealthData(syncData: syncData, registration: registration)
            
            await MainActor.run {
                self.lastSyncDate = Date()
                self.syncStatus = .success
            }
            
        } catch {
            await MainActor.run {
                self.syncStatus = .error(error.localizedDescription)
            }
        }
    }
    
    private func sendHealthData(syncData: [String: Any], registration: DeviceRegistration) async throws {
        let jsonData = try JSONSerialization.data(withJSONObject: syncData)
        let jsonString = String(data: jsonData, encoding: .utf8)!
        
        // Calculate HMAC signature
        let signature = try calculateHmacSignature(data: jsonString, secret: registration.hmacSecret)
        let idempotencyKey = UUID().uuidString
        
        let url = URL(string: "https://wehexulgoxwswkaoygnx.supabase.co/functions/v1/health-sync")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(registration.jwtToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("sha256=\(signature)", forHTTPHeaderField: "X-Signature")
        request.setValue(idempotencyKey, forHTTPHeaderField: "X-Idempotency-Key")
        request.httpBody = jsonData
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw HealthError.syncFailed
        }
    }
    
    private func calculateHmacSignature(data: String, secret: String) throws -> String {
        let key = SymmetricKey(data: Data(hex: secret))
        let signature = HMAC<SHA256>.authenticationCode(for: Data(data.utf8), using: key)
        return Data(signature).map { String(format: "%02hhx", $0) }.joined()
    }
    
    // MARK: - Background Sync
    
    func scheduleBackgroundSync() {
        let request = BGAppRefreshTaskRequest(identifier: "com.exercita.health-sync")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 24 * 60 * 60) // 24 hours
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Could not schedule app refresh: \(error)")
        }
    }
    
    func handleBackgroundSync() async {
        await syncHealthData()
        scheduleBackgroundSync() // Schedule next sync
    }
    
    // MARK: - Helper Methods
    
    private func getDeviceRegistration() -> DeviceRegistration? {
        guard let deviceId = keychain.retrieve(key: "device_id"),
              let hmacSecret = keychain.retrieve(key: "hmac_secret"),
              let jwtToken = keychain.retrieve(key: "jwt_token"),
              keychain.retrieve(key: "device_registered") == "true" else {
            return nil
        }
        
        return DeviceRegistration(deviceId: deviceId, hmacSecret: hmacSecret, jwtToken: jwtToken)
    }
}

// MARK: - Error Types

enum HealthError: LocalizedError {
    case healthKitNotAvailable
    case permissionDenied
    case registrationFailed
    case invalidResponse
    case deviceNotRegistered
    case syncFailed
    
    var errorDescription: String? {
        switch self {
        case .healthKitNotAvailable:
            return "HealthKit não está disponível neste dispositivo"
        case .permissionDenied:
            return "Permissões do HealthKit foram negadas"
        case .registrationFailed:
            return "Falha no registro do dispositivo"
        case .invalidResponse:
            return "Resposta inválida do servidor"
        case .deviceNotRegistered:
            return "Dispositivo não está registrado"
        case .syncFailed:
            return "Falha na sincronização dos dados"
        }
    }
}

// MARK: - Data Extension

extension Data {
    init(hex: String) {
        self.init()
        
        let len = hex.count / 2
        var data = Data(capacity: len)
        
        for i in 0..<len {
            let j = hex.index(hex.startIndex, offsetBy: i * 2)
            let k = hex.index(j, offsetBy: 2)
            let bytes = hex[j..<k]
            if var num = UInt8(bytes, radix: 16) {
                data.append(&num, count: 1)
            }
        }
        
        self = data
    }
}