import { Context } from "npm:hono";

export const enhanceText = async (c: Context) => {
  try {
    const { text, instruction } = await c.req.json();
    let apiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Fallback or correction logic for API key
    // Sometimes keys are set in lowercase or the primary one is a placeholder
    const altKey = Deno.env.get('openai_api_key');
    
    console.log('🔑 Checking API keys:', {
      OPENAI_API_KEY: apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)} (length: ${apiKey.length})` : 'not set',
      openai_api_key: altKey ? `${altKey.substring(0, 7)}...${altKey.substring(altKey.length - 4)} (length: ${altKey.length})` : 'not set'
    });
    
    // 🔧 FIX: Detect Supabase keys being used incorrectly as OpenAI keys
    if (apiKey && (apiKey.startsWith('sb_') || apiKey.startsWith('eyJ'))) {
      console.error('❌ OPENAI_API_KEY is set to a Supabase key! This will not work.');
      apiKey = null; // Invalidate it
    }
    
    if (altKey && (altKey.startsWith('sb_') || altKey.startsWith('eyJ'))) {
      console.error('❌ openai_api_key is set to a Supabase key! This will not work.');
      // Don't use it
    } else if ((!apiKey || apiKey.length < 20) && altKey && altKey.length > 20) {
      console.log('⚠️ OPENAI_API_KEY seems invalid or missing, using openai_api_key instead');
      apiKey = altKey;
    }

    if (!apiKey || apiKey.length < 20) {
      console.error('❌ Missing or invalid OPENAI_API_KEY. Current value length:', apiKey?.length || 0);
      return c.json({ 
        error: 'AI service not configured',
        details: 'The OPENAI_API_KEY environment variable is missing or invalid. Please provide a valid OpenAI API key (starts with sk-).'
      }, 503);
    }

    if (!text) {
      return c.json({ error: 'Text is required' }, 400);
    }

    console.log(`🤖 Enhancing text with instruction: "${instruction}"`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI writing assistant for a digital time capsule app called "Eras".
            Your goal is to help users write meaningful messages to their future selves or loved ones.
            Follow the user's instruction to rewrite their text.
            Maintain the user's original voice and intent, but improve the writing according to the specific instruction.
            Return ONLY the rewritten text, without any introductory or concluding remarks.`
          },
          {
            role: 'user',
            content: `Original Text: "${text}"\n\nInstruction: ${instruction}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const enhancedText = data.choices[0]?.message?.content?.trim();

    if (!enhancedText) {
      throw new Error('No content received from AI');
    }

    console.log('✅ Text enhanced successfully');
    return c.json({ enhanced: enhancedText });

  } catch (error) {
    console.error('💥 AI Enhancement Error:', error);
    return c.json({ 
      error: 'Failed to enhance text',
      details: error.message 
    }, 500);
  }
};