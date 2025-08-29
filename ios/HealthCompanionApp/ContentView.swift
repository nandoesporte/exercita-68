import SwiftUI
import HealthKit

struct ContentView: View {
    @StateObject private var healthManager = HealthKitManager()
    @State private var showingJWTInput = false
    @State private var jwtToken = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerView
                    
                    // Status Card
                    statusCard
                    
                    // Instructions Card
                    instructionsCard
                    
                    // Action Buttons
                    actionButtons
                    
                    Spacer()
                }
                .padding(24)
            }
            .background(Color.black.edgesIgnoringSafeArea(.all))
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingJWTInput) {
            JWTInputView(jwtToken: $jwtToken) { token in
                Task {
                    do {
                        try await healthManager.registerDevice(jwtToken: token)
                    } catch {
                        print("Registration error: \(error)")
                    }
                }
            }
        }
    }
    
    var headerView: some View {
        HStack {
            Image(systemName: "heart.fill")
                .font(.largeTitle)
                .foregroundColor(.orange)
            
            VStack(alignment: .leading) {
                Text("Exercita Health")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Sincronização de Dados de Saúde")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
        }
    }
    
    var statusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Status da Conexão")
                .font(.headline)
                .foregroundColor(.white)
            
            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 10, height: 10)
                
                Text(statusText)
                    .font(.body)
                    .foregroundColor(.gray)
            }
            
            if let lastSync = healthManager.lastSyncDate {
                Text("Última sincronização: \(lastSync, formatter: dateFormatter)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            // Sync status
            switch healthManager.syncStatus {
            case .syncing:
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("Sincronizando...")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            case .success:
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("Sincronização concluída")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            case .error(let message):
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text(message)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            case .idle:
                EmptyView()
            }
        }
        .padding(20)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
    
    var instructionsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Como usar")
                .font(.headline)
                .foregroundColor(.white)
            
            VStack(alignment: .leading, spacing: 8) {
                instructionStep(number: "1", text: "Conecte com o HealthKit para permitir acesso aos dados de saúde")
                instructionStep(number: "2", text: "Registre este dispositivo com sua conta Exercita")
                instructionStep(number: "3", text: "Os dados serão sincronizados automaticamente em segundo plano")
            }
        }
        .padding(20)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
    
    func instructionStep(number: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(number)
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.orange)
                .frame(width: 20, height: 20)
                .background(Color.orange.opacity(0.2))
                .clipShape(Circle())
            
            Text(text)
                .font(.body)
                .foregroundColor(.gray)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
    
    var actionButtons: some View {
        VStack(spacing: 12) {
            // Primary Action Button
            Button(action: primaryAction) {
                HStack {
                    if healthManager.syncStatus == .syncing {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(0.8)
                    }
                    
                    Text(primaryButtonText)
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color.orange)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(healthManager.syncStatus == .syncing)
            
            // Sync Button
            if healthManager.isAuthorized && isDeviceRegistered {
                Button(action: {
                    Task {
                        await healthManager.syncHealthData()
                    }
                }) {
                    Text("Sincronizar Agora")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color.orange.opacity(0.2))
                        .foregroundColor(.orange)
                        .cornerRadius(12)
                }
                .disabled(healthManager.syncStatus == .syncing)
            }
            
            // Settings Button
            Button(action: {
                // Open Health app or settings
                if let url = URL(string: "x-apple-health://") {
                    UIApplication.shared.open(url)
                }
            }) {
                Text("Configurações do HealthKit")
                    .fontWeight(.medium)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Color.clear)
                    .foregroundColor(.gray)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
            }
        }
    }
    
    // MARK: - Computed Properties
    
    var statusColor: Color {
        if healthManager.isAuthorized && isDeviceRegistered {
            return .green
        } else if healthManager.isAuthorized {
            return .orange
        } else {
            return .red
        }
    }
    
    var statusText: String {
        if healthManager.isAuthorized && isDeviceRegistered {
            return "Dispositivo registrado e pronto para sincronização"
        } else if healthManager.isAuthorized {
            return "HealthKit conectado - Dispositivo não registrado"
        } else {
            return "HealthKit não conectado"
        }
    }
    
    var primaryButtonText: String {
        if !healthManager.isAuthorized {
            return "Conectar HealthKit"
        } else if !isDeviceRegistered {
            return "Registrar Dispositivo"
        } else {
            return "Reconectar"
        }
    }
    
    var isDeviceRegistered: Bool {
        KeychainManager().retrieve(key: "device_registered") == "true"
    }
    
    // MARK: - Actions
    
    func primaryAction() {
        if !healthManager.isAuthorized {
            Task {
                do {
                    try await healthManager.requestHealthKitPermission()
                } catch {
                    print("HealthKit permission error: \(error)")
                }
            }
        } else if !isDeviceRegistered {
            showingJWTInput = true
        } else {
            // Reconnect - show JWT input again
            showingJWTInput = true
        }
    }
    
    // MARK: - Formatters
    
    var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter
    }
}

// MARK: - JWT Input View

struct JWTInputView: View {
    @Binding var jwtToken: String
    @Environment(\.presentationMode) var presentationMode
    let onSubmit: (String) -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Token de Autenticação")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text("Cole o token JWT obtido no app principal do Exercita:")
                        .font(.body)
                        .foregroundColor(.gray)
                    
                    TextEditor(text: $jwtToken)
                        .font(.system(.body, design: .monospaced))
                        .padding(12)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                        .frame(minHeight: 120)
                }
                
                Button(action: {
                    onSubmit(jwtToken)
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Registrar Dispositivo")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(jwtToken.isEmpty ? Color.gray : Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .disabled(jwtToken.isEmpty)
                
                Spacer()
            }
            .padding(24)
            .background(Color.black.edgesIgnoringSafeArea(.all))
            .navigationTitle("Registro")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancelar") {
                    presentationMode.wrappedValue.dismiss()
                }
                .foregroundColor(.orange)
            )
        }
    }
}

// MARK: - Preview

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}