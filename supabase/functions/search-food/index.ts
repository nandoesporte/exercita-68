import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  source: 'local' | 'openfoodfacts' | 'edamam';
  serving_size: string;
}

const LOCAL_FOODS: FoodItem[] = [
  { id: "1", name: "Frango Grelhado", calories: 165, protein: 31, carbs: 0, fats: 3.6, source: "local", serving_size: "100g" },
  { id: "2", name: "Arroz Branco", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, source: "local", serving_size: "100g" },
  { id: "3", name: "Feijão Preto", calories: 132, protein: 8.9, carbs: 23, fats: 0.5, source: "local", serving_size: "100g" },
  { id: "4", name: "Batata Doce", calories: 86, protein: 1.6, carbs: 20, fats: 0.1, source: "local", serving_size: "100g" },
  { id: "5", name: "Ovo Cozido", calories: 155, protein: 13, carbs: 1.1, fats: 11, source: "local", serving_size: "1 unidade" },
  { id: "6", name: "Banana", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, source: "local", serving_size: "1 unidade" },
  { id: "7", name: "Aveia", calories: 389, protein: 16.9, carbs: 66, fats: 6.9, source: "local", serving_size: "100g" },
  { id: "8", name: "Peito de Peru", calories: 111, protein: 24, carbs: 0.7, fats: 1, source: "local", serving_size: "100g" },
  { id: "9", name: "Iogurte Grego Natural", calories: 59, protein: 10, carbs: 3.6, fats: 0.4, source: "local", serving_size: "100g" },
  { id: "10", name: "Salmão", calories: 208, protein: 20, carbs: 0, fats: 13, source: "local", serving_size: "100g" },
  { id: "11", name: "Pão Integral", calories: 247, protein: 13, carbs: 41, fats: 3.4, source: "local", serving_size: "100g" },
  { id: "12", name: "Leite Desnatado", calories: 34, protein: 3.4, carbs: 5, fats: 0.1, source: "local", serving_size: "100ml" },
  { id: "13", name: "Queijo Cottage", calories: 98, protein: 11, carbs: 3.4, fats: 4.3, source: "local", serving_size: "100g" },
  { id: "14", name: "Maçã", calories: 52, protein: 0.3, carbs: 14, fats: 0.2, source: "local", serving_size: "1 unidade" },
  { id: "15", name: "Amendoim", calories: 567, protein: 26, carbs: 16, fats: 49, source: "local", serving_size: "100g" },
];

async function searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
  try {
    console.log(`Searching Open Food Facts for: ${query}`);
    const response = await fetch(
      `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`
    );

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.products || [])
      .map((product: any) => ({
        id: `off_${product.code || Math.random().toString()}`,
        name: product.product_name_pt || product.product_name || "Produto sem nome",
        calories: Math.round(product.nutriments?.["energy-kcal_100g"] || 0),
        protein: Math.round((product.nutriments?.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((product.nutriments?.carbohydrates_100g || 0) * 10) / 10,
        fats: Math.round((product.nutriments?.fat_100g || 0) * 10) / 10,
        source: "openfoodfacts" as const,
        serving_size: "100g",
      }))
      .filter((item: FoodItem) => item.calories > 0 && item.name !== "Produto sem nome");
  } catch (error) {
    console.error("Error searching Open Food Facts:", error);
    return [];
  }
}

async function searchEdamam(query: string): Promise<FoodItem[]> {
  const appId = Deno.env.get('EDAMAM_APP_ID');
  const appKey = Deno.env.get('EDAMAM_APP_KEY');

  if (!appId || !appKey) {
    console.log('Edamam credentials not configured');
    return [];
  }

  try {
    console.log(`Searching Edamam for: ${query}`);
    const response = await fetch(
      `https://api.edamam.com/api/food-database/v2/parser?ingr=${encodeURIComponent(query)}&app_id=${appId}&app_key=${appKey}`
    );

    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.hints || [])
      .slice(0, 10)
      .map((hint: any) => {
        const food = hint.food;
        const nutrients = food.nutrients || {};
        
        return {
          id: `edamam_${food.foodId || Math.random().toString()}`,
          name: food.label || "Alimento sem nome",
          calories: Math.round(nutrients.ENERC_KCAL || 0),
          protein: Math.round((nutrients.PROCNT || 0) * 10) / 10,
          carbs: Math.round((nutrients.CHOCDF || 0) * 10) / 10,
          fats: Math.round((nutrients.FAT || 0) * 10) / 10,
          source: "edamam" as const,
          serving_size: "100g",
        };
      })
      .filter((item: FoodItem) => item.calories > 0);
  } catch (error) {
    console.error("Error searching Edamam:", error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let searchTerm: string | null = null;

    // Support both GET and POST
    if (req.method === 'GET') {
      const url = new URL(req.url);
      searchTerm = url.searchParams.get('q');
    } else if (req.method === 'POST') {
      const body = await req.json();
      searchTerm = body.q;
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Search term must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedTerm = searchTerm.trim().toLowerCase();
    console.log(`Processing search for: ${normalizedTerm}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cachedResults } = await supabase
      .from('food_search_cache')
      .select('results, source')
      .eq('search_term', normalizedTerm)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cachedResults) {
      console.log(`Cache hit for term: ${normalizedTerm}`);
      return new Response(
        JSON.stringify({ 
          results: cachedResults.results,
          cached: true,
          source: cachedResults.source
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Cache miss for term: ${normalizedTerm}, fetching from sources...`);

    // Search local database first
    const localResults = LOCAL_FOODS.filter((food) =>
      food.name.toLowerCase().includes(normalizedTerm)
    );

    let allResults: FoodItem[] = [...localResults];
    let primarySource = 'local';

    try {
      // Try Open Food Facts
      const offResults = await searchOpenFoodFacts(normalizedTerm);
      if (offResults.length > 0) {
        allResults = [...allResults, ...offResults];
        primarySource = 'openfoodfacts';
        console.log(`Found ${offResults.length} results from Open Food Facts`);
      }

      // Try Edamam if we don't have enough results
      if (allResults.length < 10) {
        const edamamResults = await searchEdamam(normalizedTerm);
        if (edamamResults.length > 0) {
          allResults = [...allResults, ...edamamResults];
          primarySource = 'edamam';
          console.log(`Found ${edamamResults.length} results from Edamam`);
        }
      }
    } catch (apiError) {
      console.error('External API error, using local results only:', apiError);
      // Fallback: continue with local results
    }

    // Remove duplicates based on normalized names
    const uniqueResults = Array.from(
      new Map(
        allResults.map(item => [item.name.toLowerCase().trim(), item])
      ).values()
    );

    // Store in cache (fire and forget, don't wait)
    if (uniqueResults.length > 0) {
      supabase
        .from('food_search_cache')
        .insert({
          search_term: normalizedTerm,
          results: uniqueResults,
          source: primarySource,
        })
        .then(() => console.log(`Cached ${uniqueResults.length} results for: ${normalizedTerm}`))
        .catch(err => console.error('Cache insert error:', err));
    }

    return new Response(
      JSON.stringify({ 
        results: uniqueResults,
        cached: false,
        source: primarySource,
        count: uniqueResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-food function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        results: LOCAL_FOODS, // Fallback to local
        fallback: true
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});