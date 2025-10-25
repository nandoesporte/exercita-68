/**
 * Nutrition Calculation Utilities
 * 
 * Implements precise formulas for BMI, BMR, and macronutrient calculations
 * based on Mifflin-St Jeor equation and standard nutrition guidelines.
 */

export interface NutritionInput {
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo: 'M' | 'F';
  atividade_fisica: 'sedentarismo' | 'leve' | 'moderada' | 'alta';
  objetivo?: 'perda_peso' | 'manutencao' | 'ganho_massa';
}

export interface MacronutrienteDetalhado {
  gramas: number;
  kcal: number;
  percentual: number;
}

export interface AvaliacaoNutricional {
  imc: number;
  tmb: number;
  calorias_alvo: number;
  macros: {
    proteina: MacronutrienteDetalhado;
    carboidrato: MacronutrienteDetalhado;
    gordura: MacronutrienteDetalhado;
  };
}

/**
 * Calculates comprehensive nutrition assessment
 * 
 * @param input - User's physical data and goals
 * @returns Complete nutrition assessment with BMI, BMR, target calories, and macros
 */
export function calcularAvaliacaoNutricional(input: NutritionInput): AvaliacaoNutricional {
  const { peso_kg, altura_cm, idade, sexo, atividade_fisica, objetivo = 'manutencao' } = input;

  // Calculate IMC (Body Mass Index)
  // Formula: IMC = peso_kg / (altura_m)^2
  const altura_m = altura_cm / 100;
  const imc = Math.round((peso_kg / (altura_m * altura_m)) * 10) / 10;

  // Calculate TMB (Basal Metabolic Rate) using Mifflin-St Jeor equation
  // Men: TMB = 10*peso + 6.25*altura_cm - 5*idade + 5
  // Women: TMB = 10*peso + 6.25*altura_cm - 5*idade - 161
  let tmb: number;
  if (sexo === 'M') {
    tmb = Math.round((10 * peso_kg) + (6.25 * altura_cm) - (5 * idade) + 5);
  } else {
    tmb = Math.round((10 * peso_kg) + (6.25 * altura_cm) - (5 * idade) - 161);
  }

  // Activity factors
  const fatores_atividade: Record<string, number> = {
    'sedentarismo': 1.2,
    'leve': 1.375,
    'moderada': 1.55,
    'alta': 1.725
  };

  const fator_atividade = fatores_atividade[atividade_fisica] || 1.2;
  const calorias_manutencao = Math.round(tmb * fator_atividade);

  // Adjust calories based on goal
  let calorias_alvo: number;
  if (objetivo === 'perda_peso') {
    // Weight loss: -500 kcal or -15% if maintenance < 2000kcal
    if (calorias_manutencao < 2000) {
      calorias_alvo = Math.round(calorias_manutencao * 0.85);
    } else {
      calorias_alvo = calorias_manutencao - 500;
    }
  } else if (objetivo === 'ganho_massa') {
    // Muscle gain: +300 kcal
    calorias_alvo = calorias_manutencao + 300;
  } else {
    // Maintenance
    calorias_alvo = calorias_manutencao;
  }

  // Macro percentages by goal
  let protein_percent: number, carb_percent: number, fat_percent: number;
  
  if (objetivo === 'perda_peso') {
    // Weight loss: P 30% / C 35% / G 35%
    protein_percent = 0.30;
    carb_percent = 0.35;
    fat_percent = 0.35;
  } else if (objetivo === 'ganho_massa') {
    // Muscle gain: P 25% / C 50% / G 25%
    protein_percent = 0.25;
    carb_percent = 0.50;
    fat_percent = 0.25;
  } else {
    // Maintenance: P 20% / C 50% / G 30%
    protein_percent = 0.20;
    carb_percent = 0.50;
    fat_percent = 0.30;
  }

  // Convert to grams
  // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
  const proteina_g = Math.round((calorias_alvo * protein_percent) / 4);
  const carboidrato_g = Math.round((calorias_alvo * carb_percent) / 4);
  const gordura_g = Math.round((calorias_alvo * fat_percent) / 9);

  // Calculate kcal for each macro
  const proteina_kcal = Math.round(proteina_g * 4);
  const carboidrato_kcal = Math.round(carboidrato_g * 4);
  const gordura_kcal = Math.round(gordura_g * 9);

  return {
    imc,
    tmb,
    calorias_alvo,
    macros: {
      proteina: {
        gramas: proteina_g,
        kcal: proteina_kcal,
        percentual: Math.round(protein_percent * 100)
      },
      carboidrato: {
        gramas: carboidrato_g,
        kcal: carboidrato_kcal,
        percentual: Math.round(carb_percent * 100)
      },
      gordura: {
        gramas: gordura_g,
        kcal: gordura_kcal,
        percentual: Math.round(fat_percent * 100)
      }
    }
  };
}

/**
 * Get BMI classification in Portuguese
 */
export function getClassificacaoIMC(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

/**
 * Get activity level description in Portuguese
 */
export function getDescricaoAtividade(atividade: string): string {
  const descricoes: Record<string, string> = {
    'sedentarismo': 'Pouco ou nenhum exercício',
    'leve': 'Exercício leve 1-3 dias/semana',
    'moderada': 'Exercício moderado 3-5 dias/semana',
    'alta': 'Exercício intenso 6-7 dias/semana'
  };
  return descricoes[atividade] || atividade;
}

/**
 * Get goal description in Portuguese
 */
export function getDescricaoObjetivo(objetivo: string): string {
  const descricoes: Record<string, string> = {
    'perda_peso': 'Perda de peso',
    'manutencao': 'Manutenção de peso',
    'ganho_massa': 'Ganho de massa muscular'
  };
  return descricoes[objetivo] || objetivo;
}
