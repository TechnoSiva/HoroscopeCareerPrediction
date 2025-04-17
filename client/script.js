document.getElementById('astro-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get all form values
  const name = document.getElementById('name').value;
  const gender = document.getElementById('gender').value;
  const dob = document.getElementById('dob').value;
  const tob = document.getElementById('tob').value;
  const location = document.getElementById('location').value;
  const zodiac = document.getElementById('zodiac').value; // Get zodiac from dropdown
  
  // Get selected skills
  const skillsCheckboxes = document.querySelectorAll('input[name="skills"]:checked');
  const skills = Array.from(skillsCheckboxes).map(checkbox => checkbox.value);
  
  // Show loader
  document.getElementById('loader').style.display = 'block';
  document.getElementById('result').innerHTML = '';
  
  try {
    console.log("Sending data to server:", { name, gender, dob, tob, location, zodiac, skills });
    
    const res = await fetch('http://localhost:5000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        gender, 
        dob, 
        tob, 
        location, 
        zodiac,
        skills 
      }),
    });
    
    // Hide loader
    document.getElementById('loader').style.display = 'none';
    
    // Parse response
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || `Server responded with status: ${res.status}`);
    }
    
    if (data.result) {
      // Add offline note if present
      const offlineNote = data.note ? `<p class="offline-note">${data.note}</p>` : '';
      
      // Save to history with timestamp
      const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
      history.unshift({ 
        name,
        gender,
        dob, 
        tob, 
        location,
        zodiac,
        skills,
        result: data.result,
        timestamp: new Date().toLocaleString()
      });
      localStorage.setItem('predictionHistory', JSON.stringify(history));
      
      // Display result on same page
      document.getElementById('result').innerHTML = `
        <div class="prediction-result">
          <h2>Your Career Prediction</h2>
          ${offlineNote}
          <div class="prediction-content">${formatPrediction(data.result)}</div>
        </div>
      `;
      
      // Smooth scroll to result
      document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('result').innerHTML = '<p class="error">Prediction failed. Please try again.</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('loader').style.display = 'none';
    
    // Check for network error
    if (error.message === 'Failed to fetch' || !navigator.onLine) {
      document.getElementById('result').innerHTML = `
        <div class="error-container">
          <p class="error">Network error: Please check your internet connection</p>
          <button onclick="runOfflinePrediction()">Try Offline Mode</button>
        </div>
      `;
    } else {
      document.getElementById('result').innerHTML = `
        <div class="error-container">
          <p class="error">An error occurred: ${error.message}</p>
          <button onclick="runOfflinePrediction()">Try Offline Mode</button>
        </div>
      `;
    }
  }
});

// Format prediction text with markdown-like syntax
function formatPrediction(text) {
  // Replace markdown headings with HTML
  text = text.replace(/^# (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  
  // Replace bullet points
  text = text.replace(/^\* (.*$)/gim, '<li>$1</li>');
  text = text.replace(/^- (.*$)/gim, '<li>$1</li>');
  
  // Replace numbered lists
  text = text.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Add paragraph tags for line breaks
  text = text.replace(/\n\n/g, '</p><p>');
  
  // Wrap in paragraph tags
  return `<p>${text}</p>`;
}

// Offline prediction as fallback
function runOfflinePrediction() {
  const name = document.getElementById('name').value;
  const gender = document.getElementById('gender').value;
  const dob = document.getElementById('dob').value;
  const tob = document.getElementById('tob').value;
  const location = document.getElementById('location').value;
  const zodiac = document.getElementById('zodiac').value; // Get zodiac from dropdown
  
  // Get skills
  const skillsCheckboxes = document.querySelectorAll('input[name="skills"]:checked');
  const skills = Array.from(skillsCheckboxes).map(checkbox => checkbox.value);
  
  // Generate offline prediction
  const offlinePrediction = generateOfflinePrediction(name, zodiac, skills);
  
  // Save to history
  const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
  history.unshift({ 
    name,
    gender,
    dob, 
    tob, 
    location,
    zodiac,
    skills,
    result: offlinePrediction,
    timestamp: new Date().toLocaleString(),
    offline: true
  });
  localStorage.setItem('predictionHistory', JSON.stringify(history));
  
  // Display result
  document.getElementById('result').innerHTML = `
    <div class="prediction-result">
      <h2>Your Career Prediction</h2>
      <p class="offline-note">Offline Mode - Server Unavailable</p>
      <div class="prediction-content">${formatPrediction(offlinePrediction)}</div>
    </div>
  `;
  
  // Scroll to result
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

// Offline prediction generator
function generateOfflinePrediction(name, zodiac, skills) {
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

// Handle offline mode with error recovery
window.addEventListener('online', () => {
  document.getElementById('result').innerHTML = '<p>Internet connection restored. You can now get predictions.</p>';
});

window.addEventListener('offline', () => {
  document.getElementById('result').innerHTML = '<p class="error">You are offline. The app will use offline prediction mode.</p>';
});