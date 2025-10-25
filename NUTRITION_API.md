# Nutrition Module API Documentation

## Base URL
All endpoints are deployed as Supabase Edge Functions:
```
https://wehexulgoxwswkaoygnx.supabase.co/functions/v1/
```

## Authentication
Most endpoints require authentication using Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Exception: `/nutrition-assessment` is public and doesn't require authentication.

---

## Endpoints

### 1. Get Nutrition Profile
**GET** `/nutrition-profile/{user_id}`

Retrieves the complete nutrition profile for a user.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "altura_cm": 175,
  "peso_kg": 80,
  "data_nascimento": "1990-01-01",
  "sexo": "M",
  "alergias": ["gluten", "lactose"],
  "restricoes": ["vegano"],
  "objetivo": "perda_peso",
  "atividade_fisica": "moderada",
  "imc": 26.1,
  "tmb": 1800,
  "macronutrientes": {
    "calorias": 2160,
    "proteinas": 162,
    "gorduras": 60,
    "carboidratos": 189
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 2. Create/Update Nutrition Profile
**POST** `/nutrition-profile/{user_id}`

Creates or updates nutrition profile with automatic BMI and BMR calculation.

**Request Body:**
```json
{
  "altura_cm": 175,
  "peso_kg": 80,
  "data_nascimento": "1990-01-01",
  "sexo": "M",
  "alergias": ["gluten"],
  "restricoes": ["vegano"],
  "objetivo": "perda_peso",
  "atividade_fisica": "moderada"
}
```

**Valid Values:**
- `sexo`: "M", "F", "Outro"
- `objetivo`: "perda_peso", "manutencao", "ganho_massa", "saude"
- `atividade_fisica`: "sedentarismo", "leve", "moderada", "alta"

**Response:** Same as GET profile

---

### 3. Create Diary Entry
**POST** `/nutrition-diary`

Registers a new food diary entry.

**Request Body:**
```json
{
  "user_id": "uuid",
  "data": "2024-01-15",
  "hora": "12:30:00",
  "refeicao_tipo": "almoco",
  "alimentos": [
    {
      "nome": "Arroz integral",
      "quantidade_unidade": "150g",
      "calorias": 180,
      "proteinas": 4,
      "gorduras": 1,
      "carboidratos": 38,
      "fonte": "manual"
    }
  ],
  "foto_url": "https://...",
  "anotacao": "Refeição leve"
}
```

**Valid Meal Types:**
- `cafe`, `lanche_manha`, `almoco`, `lanche_tarde`, `jantar`, `ceia`

**Response:**
```json
{
  "entry_id": "uuid",
  "user_id": "uuid",
  "data": "2024-01-15",
  "hora": "12:30:00",
  "refeicao_tipo": "almoco",
  "alimentos": [...],
  "foto_url": "https://...",
  "anotacao": "Refeição leve",
  "total_calorias": 180,
  "created_at": "2024-01-15T12:30:00Z"
}
```

---

### 4. Get Diary Entries
**GET** `/nutrition-diary/{user_id}?data=YYYY-MM-DD`

Retrieves diary entries for a user. Optional date filter.

**Query Parameters:**
- `data` (optional): Filter by specific date (YYYY-MM-DD)

**Response:**
```json
{
  "entries": [
    {
      "entry_id": "uuid",
      "user_id": "uuid",
      "data": "2024-01-15",
      "hora": "12:30:00",
      "refeicao_tipo": "almoco",
      "alimentos": [...],
      "total_calorias": 180
    }
  ],
  "totals": {
    "total_calorias": 1850,
    "total_refeicoes": 5
  }
}
```

---

### 5. List Recipes
**GET** `/nutrition-recipes?tags=...&dificuldade=...`

Lists recipes with optional filters.

**Query Parameters:**
- `tags` (optional): Comma-separated tags (e.g., "vegetariana,low-carb")
- `dificuldade` (optional): Filter by difficulty ("fácil", "médio", "difícil")

**Response:**
```json
{
  "recipes": [
    {
      "receita_id": "uuid",
      "titulo": "Salada Caesar",
      "descricao_curta": "Salada clássica",
      "ingredientes": [
        {
          "nome": "Alface",
          "quantidade": "1",
          "unidade": "maço"
        }
      ],
      "modo_preparo": "...",
      "tempo_minutos": 20,
      "rendimento": 2,
      "calorias_por_porcao": 250,
      "macros_por_porcao": {
        "proteina": 15,
        "gordura": 12,
        "carboidrato": 20
      },
      "tags": ["vegetariana", "rápido"],
      "nivel_dificuldade": "fácil",
      "imagem_url": "https://...",
      "criado_por": "system",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 6. Create Recipe (Admin Only)
**POST** `/nutrition-recipes`

Creates a new recipe. Requires admin privileges.

**Request Body:**
```json
{
  "titulo": "Salada Caesar",
  "descricao_curta": "Salada clássica",
  "ingredientes": [
    {
      "nome": "Alface",
      "quantidade": "1",
      "unidade": "maço"
    }
  ],
  "modo_preparo": "Lave e corte a alface...",
  "tempo_minutos": 20,
  "rendimento": 2,
  "calorias_por_porcao": 250,
  "macros_por_porcao": {
    "proteina": 15,
    "gordura": 12,
    "carboidrato": 20
  },
  "tags": ["vegetariana", "rápido"],
  "nivel_dificuldade": "fácil",
  "imagem_url": "https://..."
}
```

**Response:** Created recipe object

---

### 7. Quick Nutrition Assessment (Public)
**POST** `/nutrition-assessment`

Performs a quick nutrition assessment without authentication.

**Request Body:**
```json
{
  "peso": 80,
  "altura": 175,
  "idade": 30,
  "sexo": "M",
  "atividade": "moderada"
}
```

**Valid Activity Levels:**
- `sedentarismo`, `sedentario`, `leve`, `moderada`, `moderado`, `alta`, `alto`, `muito_alta`

**Response:**
```json
{
  "imc": {
    "valor": 26.1,
    "classificacao": "Sobrepeso"
  },
  "tmb": {
    "valor": 1800,
    "descricao": "Taxa Metabólica Basal - calorias queimadas em repouso"
  },
  "calorias_alvo": {
    "valor": 2790,
    "descricao": "Calorias diárias recomendadas para manutenção"
  },
  "macronutrientes": {
    "proteinas": {
      "gramas": 209,
      "calorias": 837,
      "percentual": 30
    },
    "gorduras": {
      "gramas": 77,
      "calorias": 698,
      "percentual": 25
    },
    "carboidratos": {
      "gramas": 314,
      "calorias": 1255,
      "percentual": 45
    }
  },
  "recomendacoes": [
    "Consulte um nutricionista para um plano personalizado",
    "Mantenha uma hidratação adequada (2-3 litros de água por dia)",
    "Pratique atividade física regularmente",
    "Evite alimentos ultraprocessados"
  ]
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

---

## Example Usage

### JavaScript/TypeScript with Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Get nutrition profile
const { data, error } = await supabase.functions.invoke('nutrition-profile/USER_ID', {
  method: 'GET'
})

// Create diary entry
const { data, error } = await supabase.functions.invoke('nutrition-diary', {
  body: {
    user_id: 'uuid',
    data: '2024-01-15',
    hora: '12:30:00',
    refeicao_tipo: 'almoco',
    alimentos: [...]
  }
})

// Quick assessment (no auth needed)
const response = await fetch('https://wehexulgoxwswkaoygnx.supabase.co/functions/v1/nutrition-assessment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    peso: 80,
    altura: 175,
    idade: 30,
    sexo: 'M',
    atividade: 'moderada'
  })
})
const assessment = await response.json()
```

---

## Notes

- All dates should be in ISO format (YYYY-MM-DD)
- Times should be in 24-hour format (HH:MM:SS)
- Numeric values for weight, height use metric system (kg, cm)
- BMI and BMR calculations use standard medical formulas
- Macronutrient distribution follows general health guidelines (30% protein, 25% fat, 45% carbs)
