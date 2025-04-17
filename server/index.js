const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai'); // Make sure to use curly braces for import

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI Configuration - Fix for authentication issues
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY || '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',
  defaultHeaders: {
    'HTTP-Referer': 'https://horoscope-career-prediction.com', // Required by some API providers
    'X-Title': 'Horoscope Career Prediction' // Required by OpenRouter
  }
});

// Main prediction endpoint
app.post('/api/predict', async (req, res) => {
  const { name, dob, tob, location, zodiac, gender, skills } = req.body;
  
  // Validate required fields
  if (!dob || !tob || !location || !zodiac) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log("Processing prediction request:", { name, dob, location, zodiac });

  // Create the prompt for the AI
  const astrologicalPrompt = `
You are an expert astrologer and career guide with deep knowledge of Vedic astrology, planetary positions, and their influence on career paths. 
Analyze the following information to provide a detailed career prediction:

**Personal Details:**
- Name: ${name || 'Not provided'}
- Date of Birth: ${dob} (YYYY-MM-DD)
- Time of Birth: ${tob} (24-hour format)
- Place of Birth: ${location} (consider timezone and geographical influences)
- Zodiac Sign: ${zodiac}
- Gender: ${gender || 'Not provided'}

**Skills Analysis:**
- Current Skills: ${skills ? skills.join(', ') : 'Not provided'}
- Evaluate which skills align astrologically with the native's chart
- Suggest additional skills to develop based on planetary strengths
- Identify potential challenges based on planetary weaknesses

**Career Prediction Guidelines:**
1. Combine astrological analysis with modern career opportunities
2. Suggest suitable career paths based on:
   - Planetary positions and aspects
   - Zodiac sign characteristics
   - Current skills and potential
   - Dasha period influences
3. Provide timing predictions:
   - Identify favorable periods (start/end years) based on Dasha and transits
   - Highlight important career transition years
4. Give practical advice on:
   - Optimal skill development timeline
   - Industries to focus on or avoid
   - Potential challenges and remedies

**Output Format:**
- Brief introduction of astrological findings
- Career suggestions combining astrology and skills
- Skill development roadmap
- Timeline prediction with key years
- Final encouraging advice

Keep the advice practical for today's world while respecting traditional astrological principles. Provide clear reasoning for your suggestions.
`;

  try {
    console.log("Sending request to OpenAI API...");
    
    // Call OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4', // or 'gpt-4' for better analysis
      messages: [
        { 
          role: 'system', 
          content: 'You are a master astrologer with 40 years of experience in career prediction. You combine Vedic astrology with modern career counseling. Your predictions are known for their accuracy and practical value.' 
        },
        { role: 'user', content: astrologicalPrompt },
      ],
      temperature: 0.7, // For balanced creativity/accuracy
      max_tokens: 1500, // Ensure sufficient length for detailed prediction
    });

    console.log("Response received successfully");
    
    // Return the prediction
    res.json({ result: chatCompletion.choices[0].message.content });
    
  } catch (error) {
    console.error('API Error details:', error);
    
    // If API key is invalid, use mock response instead of failing
    if (error.status === 401 || error.message?.includes('auth')) {
      console.log("Authentication failed, using fallback mock response");
      return res.json({ 
        result: generateMockPrediction(name, zodiac, skills),
        note: "Using offline prediction (API unavailable)"
      });
    }
    
    // Network or other errors
    res.status(500).json({ 
      error: 'Failed to get prediction', 
      message: 'Please check your connection and try again',
      details: error.message
    });
  }
});

// Fallback function to generate prediction when API fails
function generateMockPrediction(name, zodiac, skills) {
  const predictions = {
    "Aries": "Your natural leadership abilities and pioneering spirit point to entrepreneurship or management roles. The period from 2025-2027 looks particularly favorable for career advancement.",
    "Taurus": "Your practical approach and determination make you well-suited for finance, real estate, or any field requiring persistence. Focus on building stable, long-term career foundations.",
    "Gemini": "Your versatility and communication skills suggest success in media, writing, teaching, or sales. Consider developing technical skills to complement your natural adaptability.",
    "Cancer": "Your intuitive and nurturing nature indicates success in healthcare, counseling, or hospitality. Your ability to create emotional connections is your greatest professional asset.",
    "Leo": "Your charismatic presence points to success in entertainment, leadership positions, or creative fields. Developing organizational skills will help balance your natural creativity.",
    "Virgo": "Your analytical mind and attention to detail suggest excellence in research, data analysis, or quality assurance. The next two years are ideal for specialized training.",
    "Libra": "Your diplomatic nature and sense of fairness indicate potential in law, human resources, or design fields. Partnership opportunities will be significant in 2026.",
    "Scorpio": "Your investigative nature and determination point to success in research, psychology, or strategic planning. Focus on transformative career moves in late 2025.",
    "Sagittarius": "Your adventurous spirit and philosophical mind suggest teaching, publishing, or international business. Expand your horizons through education in 2025-2026.",
    "Capricorn": "Your disciplined approach and ambition indicate executive potential. Focus on building authority in your field with incremental, steady progress.",
    "Aquarius": "Your innovative thinking and humanitarian values point to technology, social enterprise, or scientific research. Group collaborations will be particularly rewarding.",
    "Pisces": "Your creative imagination and empathy suggest artistic pursuits, psychology, or spiritual guidance. Trust your intuition regarding career decisions in 2025."
  };
  
  const skillsAdvice = skills && skills.length > 0 
    ? `Your existing skills in ${skills.join(', ')} align well with your astrological profile. Consider enhancing these with additional training in complementary areas.` 
    : "Focus on developing skills that align with your natural strengths as indicated by your astrological profile.";
  
  const userName = name || "there";
  const userZodiac = zodiac || "your zodiac sign";
  
  return `
# Career Prediction for ${userName}

## Astrological Overview
As ${userZodiac}, you have unique strengths that shape your career trajectory. ${predictions[zodiac] || "Your astrological profile suggests diverse career possibilities that align with your natural talents."}

## Skills Assessment
${skillsAdvice}

## Timeline Prediction
The next 3-5 years represent a significant growth period for your career development. Pay particular attention to opportunities that arise in early 2026, as planetary alignments suggest this will be a pivotal time for professional advancement.

## Recommended Focus Areas
1. Continue developing your core competencies while exploring adjacent skill areas
2. Build your professional network in the coming months
3. Prepare for a significant career opportunity or transition in 2026

Remember that while astrological guidance provides insight, your personal effort and choices ultimately shape your professional journey. Trust your intuition while making practical, strategic decisions.
  `;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Serve static files (if needed)
app.use(express.static('public'));

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app; // For testing purposes