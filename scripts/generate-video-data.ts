import { createClient } from 'npm:@insforge/sdk';

export default async function(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { idea, duration, templateSelection, iconType } = await req.json();

    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL')!,
      anonKey: Deno.env.get('ANON_KEY')!
    });

    const templateInstruction = templateSelection === 'auto' 
        ? 'Analyze the topic and output a suitable "theme" (e.g. "cyberpunk", "glassmorphism", "minimalist") and a unique hex "color" for each item.'
        : templateSelection === 'custom'
        ? 'Use "custom" for the theme and "#ffffff" for colors as they will be overridden by the system.'
        : `Use the theme "${templateSelection}" and generate a suitable unique hex "color" for each item.`;

    const iconTypeInstruction = iconType === 'logos'
        ? 'For each item, provide a "brand_domain" (e.g. "bugatti.com", "ferrari.com") instead of focusing on the country. This will be used to fetch their official logo.'
        : 'For each item, provide a valid "country_code" (ISO 2-letter) for its origin flag.';

    const durationSeconds = Number(duration || 1) * 60;
    const itemCount = Math.max(3, Math.floor(durationSeconds / 5));

    const prompt = `
    Create a structured JSON for a comparison video about: "${idea}"
    JSON format MUST be:
    {
      "title": "Video Title",
      "theme": "theme_name_here",
      "items": [
        {
          "name": "Item Name",
          "country": "Country",
          "country_code": "ISO 2-letter code",
          "brand_domain": "official domain (e.g. brand.com)",
          "value": "Numerical data value ONLY (e.g. '304', '273', '2.1')",
          "unit": "Unit (e.g. 'MPH', 's', 'm')",
          "description": "Short 1-sentence description",
          "image_query": "specific visual search query",
          "color": "#hexcolor"
        }
      ]
    }
    ${templateInstruction}
    ${iconTypeInstruction}
    Include about ${itemCount} items to fill a ${durationSeconds} second video (approx 5s per item).
    ONLY return raw JSON.
    `;

    const completion = await client.ai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [{ role: 'user', content: prompt }],
      webSearch: { enabled: true, maxResults: 5 }
    });

    let jsonStr = completion.choices[0].message.content;
    // Basic cleanup
    const startIdx = jsonStr.indexOf('{');
    const endIdx = jsonStr.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }
    
    const data = JSON.parse(jsonStr);

    // Now, let's find images for each item
    for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const imageSearch = await client.ai.chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: `Find a direct image URL for: ${item.image_query || item.name}` }],
            webSearch: { enabled: true, maxResults: 3 }
        });
        
        // Extract URL from citations
        const citations = imageSearch.choices[0].message.annotations || [];
        const imageUrl = citations.length > 0 ? citations[0].urlCitation.url : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&color=fff&size=512`;
        
        data.items[i].imageUrl = imageUrl;
        data.items[i].flagUrl = iconType === 'logos' 
            ? `https://logo.clearbit.com/${item.brand_domain || 'google.com'}`
            : `https://flagcdn.com/w320/${(item.country_code || 'us').toLowerCase()}.png`;
            
        // Map "value" and "unit" back to "role" for the legacy template
        data.items[i].role = `${item.value} ${item.unit}`;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
