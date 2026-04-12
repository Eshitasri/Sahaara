/**
 * Claude AI Service
 * ResourceAI ka main AI brain — Anthropic Claude API se powered
 *
 * 5 features:
 * 1. Smart Matching     — donation ko best NGO se match karo
 * 2. Donation Tips      — donor ko suggest karo kya donate karein
 * 3. Fraud Explanation  — fraud kyon hua plain language mein
 * 4. Demand Prediction  — agle week kya chahiye hoga predict karo
 * 5. Welfare Chatbot    — NGO/Donor ke sawaalon ke jawab do
 */

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

// Claude client initialize karo
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-opus-4-6';

// ─── 1. SMART AI MATCHING ─────────────────────────────────────────────────────
/**
 * Claude donation aur NGO requests ko analyze karke
 * best match dhundta hai with reasoning
 */
async function smartMatch(donation, candidates) {
  try {
    logger.info(`[Claude AI] Smart matching donation: ${donation._id}`);

    const prompt = `
Tum ek social welfare AI expert ho jo resource distribution mein specialist ho.

Ek DONATION available hai:
- Category: ${donation.category?.replace('_', ' ')}
- Title: ${donation.title}
- Quantity: ${donation.quantity}
- Description: ${donation.description || 'N/A'}
- Expiry: ${donation.expiryDate ? new Date(donation.expiryDate).toLocaleDateString() : 'No expiry'}
- Pickup City: ${donation.pickupAddress}

${candidates.length} NGO REQUESTS available hain:
${candidates.map((c, i) => `
REQUEST ${i + 1}:
- NGO: ${c.request?.ngo?.name || 'Unknown'}
- Category Needed: ${c.request?.category?.replace('_', ' ')}
- Title: ${c.request?.title}
- Quantity Needed: ${c.request?.quantityNeeded}
- Beneficiaries: ${c.request?.beneficiariesCount} log
- Urgency: ${c.request?.urgency?.toUpperCase()}
- Distance: ${c.distKm} km
- Mathematical Score: ${c.score}
`).join('\n')}

Tum best match decide karo. Consider karo:
1. Category compatibility (perfect match > partial match)
2. Urgency level (critical > high > medium > low)
3. Beneficiary count (zyada log = zyada priority)
4. Distance (kam distance better hai)
5. Donation expiry vs urgency

Respond ONLY in this exact JSON format, nothing else:
{
  "bestMatchIndex": 0,
  "confidenceScore": 0.95,
  "reasoning": "2-3 sentence explanation in simple Hindi-English mix",
  "alternativeIndex": 1,
  "warnings": ["any important warnings like expiry soon"],
  "impactEstimate": "Kitne logon ko faayda hoga aur kaise"
}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    // JSON extract karo (sometimes Claude adds extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude ne valid JSON nahi diya');

    const result = JSON.parse(jsonMatch[0]);
    logger.info(`[Claude AI] Match decided: index ${result.bestMatchIndex}, confidence: ${result.confidenceScore}`);

    return {
      success: true,
      bestCandidate: candidates[result.bestMatchIndex],
      alternativeCandidate: candidates[result.alternativeIndex] || null,
      confidenceScore: result.confidenceScore,
      reasoning: result.reasoning,
      warnings: result.warnings || [],
      impactEstimate: result.impactEstimate,
      poweredBy: 'Claude AI',
    };
  } catch (err) {
    logger.error(`[Claude AI] Smart match failed: ${err.message}`);
    // Fallback to mathematical matching
    return {
      success: false,
      error: err.message,
      fallback: true,
      bestCandidate: candidates[0], // mathematical top result use karo
    };
  }
}

// ─── 2. DONATION SUGGESTIONS ──────────────────────────────────────────────────
/**
 * Donor ko personalized suggestions deta hai
 * ki kya donate karein based on current demand
 */
async function getDonationSuggestions(currentDemand, donorCity) {
  try {
    logger.info(`[Claude AI] Getting donation suggestions for ${donorCity}`);

    const prompt = `
Tum ek helpful welfare coordinator ho.

${donorCity} mein abhi yeh resources ki DEMAND hai:
${currentDemand.map(d => `- ${d.category.replace('_', ' ')}: ${d.demandCount} NGOs need kar rahe hain (gap: ${d.gap > 0 ? d.gap + ' units short' : 'sufficient'})`).join('\n')}

Ek donor help karna chahta hai. Unhe 3-4 practical suggestions do:
- Kya donate karein (specific items)
- Kyu woh item helpful hai abhi
- Kaise prepare karein donation ke liye
- Koi special tips

Respond ONLY in this JSON format:
{
  "topSuggestion": "Sabse important item jo donate karein",
  "suggestions": [
    {
      "item": "Item name",
      "reason": "Kyun zaruri hai abhi",
      "howTo": "Kaise prepare karein",
      "urgencyLevel": "high/medium/low"
    }
  ],
  "motivationalMessage": "Short inspiring message in Hindi-English mix",
  "impactStatement": "Agar yeh donate kiya toh kitne logo ko faayda hoga"
}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON from Claude');

    return { success: true, ...JSON.parse(jsonMatch[0]), poweredBy: 'Claude AI' };
  } catch (err) {
    logger.error(`[Claude AI] Donation suggestions failed: ${err.message}`);
    return {
      success: false,
      topSuggestion: 'Food items donate karein',
      suggestions: [{ item: 'Cooked food', reason: 'High demand', howTo: 'Pack in containers', urgencyLevel: 'high' }],
      motivationalMessage: 'Aapki madad se kisi ki zindagi badal sakti hai!',
    };
  }
}

// ─── 3. FRAUD EXPLANATION ────────────────────────────────────────────────────
/**
 * Fraud flags ko plain language mein explain karta hai
 * Admin ko samajhne mein help karta hai
 */
async function explainFraud(delivery, fraudFlags, fraudScore) {
  try {
    logger.info(`[Claude AI] Explaining fraud for delivery: ${delivery._id}`);

    const prompt = `
Tum ek fraud detection expert ho jo social welfare delivery systems mein specialist ho.

Ek delivery mein yeh SUSPICIOUS activity detect hui hai:

Delivery Details:
- Volunteer: ${delivery.volunteer?.name || 'Unknown'}
- From: ${delivery.donor?.name} → To: ${delivery.ngo?.ngoName || delivery.ngo?.name}
- Status: ${delivery.status}
- Fraud Score: ${fraudScore}/100

Detected Flags:
${fraudFlags.map(f => `- ${f.type}: ${f.description}`).join('\n')}

Yeh explain karo:
1. Kya actually galat hua
2. Yeh kitna serious hai
3. Admin ko kya karna chahiye
4. Future mein kaise rokein

Respond ONLY in JSON:
{
  "severityLevel": "low/medium/high/critical",
  "summary": "1 sentence main kya hua",
  "explanation": "Plain language mein detailed explanation (Hindi-English mix)",
  "recommendedAction": "Admin ko exactly kya karna chahiye",
  "preventionTip": "Future mein kaise avoid karein",
  "isLikelyFraud": true/false
}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON');

    return { success: true, ...JSON.parse(jsonMatch[0]), poweredBy: 'Claude AI' };
  } catch (err) {
    logger.error(`[Claude AI] Fraud explanation failed: ${err.message}`);
    return {
      success: false,
      severityLevel: fraudScore >= 70 ? 'high' : 'medium',
      summary: 'Suspicious activity detected in delivery',
      explanation: fraudFlags.map(f => f.description).join('. '),
      recommendedAction: 'Review delivery manually and contact volunteer',
    };
  }
}

// ─── 4. DEMAND PREDICTION ────────────────────────────────────────────────────
/**
 * Historical data se predict karta hai
 * agle hafte kya demand hogi
 */
async function predictDemand(historicalData, currentData, city) {
  try {
    logger.info(`[Claude AI] Predicting demand for ${city}`);

    const prompt = `
Tum ek data analyst ho jo social welfare trends predict karte ho.

${city} ka CURRENT demand data:
${currentData.map(d => `- ${d.category.replace('_', ' ')}: ${d.demandCount} requests, ${d.surplusCount} donations available, gap: ${d.gap}`).join('\n')}

Historical patterns (last 4 weeks):
${JSON.stringify(historicalData, null, 2)}

Agle 7 din ke liye predict karo:
1. Kaunsi category mein demand badhegi
2. Kitne donors ki zarurat hogi
3. Kaunse areas mein zyada need hogi
4. Koi upcoming events/festivals jo demand affect karein

Respond ONLY in JSON:
{
  "weeklyForecast": [
    {
      "category": "food_cooked",
      "predictedDemand": 15,
      "currentDemand": 10,
      "trend": "increasing/stable/decreasing",
      "confidence": 0.85,
      "reason": "Kyun yeh prediction hai"
    }
  ],
  "urgentAlert": "Koi specific warning jo admin ko jaanni chahiye",
  "donorRecruitmentNeeded": "Kaunse category mein aur donors chahiye",
  "hotspotAreas": ["Area1", "Area2"],
  "weekSummary": "Overall agle hafte kaisa rahega"
}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON');

    return { success: true, ...JSON.parse(jsonMatch[0]), poweredBy: 'Claude AI', generatedAt: new Date() };
  } catch (err) {
    logger.error(`[Claude AI] Demand prediction failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─── 5. WELFARE CHATBOT ───────────────────────────────────────────────────────
/**
 * Users ke sawaalon ke jawab deta hai
 * NGO, Donor, Volunteer — sab ke liye helpful
 */
async function welfareChatbot(userMessage, userRole, conversationHistory = []) {
  try {
    logger.info(`[Claude AI] Chatbot query from ${userRole}: ${userMessage.substring(0, 50)}`);

    const systemPrompt = `Tum ResourceAI ka helpful welfare assistant ho. 
Tumhara kaam hai ${userRole}s ki help karna is platform ko use karne mein.

Platform ke baare mein:
- Donors food, kapde, medicines donate kar sakte hain
- NGOs resource requests submit kar sakte hain  
- Volunteers deliveries pick up karke deliver karte hain
- AI automatically donation ko NGO request se match karta hai
- Har delivery GPS track hoti hai aur OTP se verify hoti hai

Rules:
- Hamesha helpful aur positive raho
- Hindi aur English mix mein jawab do (Hinglish)
- Short aur clear jawab do (max 3-4 sentences)
- Platform se related questions ke liye specific steps batao
- Agar kuch nahi pata toh honestly bolo`;

    // Conversation history format karo
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0].text;
    logger.info(`[Claude AI] Chatbot replied successfully`);

    return {
      success: true,
      reply,
      poweredBy: 'Claude AI',
    };
  } catch (err) {
    logger.error(`[Claude AI] Chatbot failed: ${err.message}`);
    return {
      success: false,
      reply: 'Maafi chahta hoon, abhi mujhe samajhne mein thodi mushkil ho rahi hai. Please thodi der baad try karein ya admin se contact karein.',
    };
  }
}

// ─── 6. NGO REQUEST ANALYZER ─────────────────────────────────────────────────
/**
 * Jab NGO request submit kare,
 * Claude automatically priority aur tags set karta hai
 */
async function analyzeNGORequest(requestData) {
  try {
    const prompt = `
Ek NGO ne yeh resource request submit ki hai:
- Category: ${requestData.category}
- Title: ${requestData.title}
- Quantity: ${requestData.quantityNeeded}
- Beneficiaries: ${requestData.beneficiariesCount}
- Urgency (self-reported): ${requestData.urgency}
- Description: ${requestData.description || 'N/A'}

Analyze karo aur decide karo:
1. Kya self-reported urgency sahi lagti hai?
2. Priority score 1-10 (10 = most urgent)
3. Special tags jo helpful honge

Respond ONLY in JSON:
{
  "verifiedUrgency": "low/medium/high/critical",
  "priorityScore": 8,
  "tags": ["perishable-needed", "children", "elderly"],
  "reasoning": "Kyun yeh priority diya",
  "suggestedMatchCategory": "food_cooked"
}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON');

    return { success: true, ...JSON.parse(jsonMatch[0]) };
  } catch (err) {
    logger.error(`[Claude AI] NGO request analysis failed: ${err.message}`);
    return { success: false };
  }
}

module.exports = {
  smartMatch,
  getDonationSuggestions,
  explainFraud,
  predictDemand,
  welfareChatbot,
  analyzeNGORequest,
};
