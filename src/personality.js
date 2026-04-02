// personality.js — Personality Engine for AgentVerse
// Translates MBTI, zodiac, and traits into concrete behavioral rules for the LLM

// ============================================================
// MBTI DIMENSION MAPS
// ============================================================

// Each MBTI type mapped to Big Five approximations (0-100 scale)
var MBTI_TO_BIG5 = {
  INTJ: { openness: 85, conscientiousness: 80, extraversion: 25, agreeableness: 35, neuroticism: 40 },
  INTP: { openness: 90, conscientiousness: 45, extraversion: 30, agreeableness: 50, neuroticism: 45 },
  ENTJ: { openness: 75, conscientiousness: 85, extraversion: 80, agreeableness: 30, neuroticism: 35 },
  ENTP: { openness: 92, conscientiousness: 40, extraversion: 78, agreeableness: 45, neuroticism: 40 },
  INFJ: { openness: 80, conscientiousness: 70, extraversion: 30, agreeableness: 75, neuroticism: 55 },
  INFP: { openness: 88, conscientiousness: 40, extraversion: 25, agreeableness: 80, neuroticism: 60 },
  ENFJ: { openness: 75, conscientiousness: 72, extraversion: 82, agreeableness: 85, neuroticism: 45 },
  ENFP: { openness: 92, conscientiousness: 35, extraversion: 85, agreeableness: 78, neuroticism: 50 },
  ISTJ: { openness: 30, conscientiousness: 90, extraversion: 28, agreeableness: 55, neuroticism: 35 },
  ISFJ: { openness: 35, conscientiousness: 82, extraversion: 25, agreeableness: 85, neuroticism: 50 },
  ESTJ: { openness: 32, conscientiousness: 88, extraversion: 78, agreeableness: 40, neuroticism: 30 },
  ESFJ: { openness: 38, conscientiousness: 75, extraversion: 82, agreeableness: 88, neuroticism: 45 },
  ISTP: { openness: 60, conscientiousness: 45, extraversion: 35, agreeableness: 40, neuroticism: 30 },
  ISFP: { openness: 72, conscientiousness: 38, extraversion: 30, agreeableness: 72, neuroticism: 50 },
  ESTP: { openness: 55, conscientiousness: 35, extraversion: 88, agreeableness: 42, neuroticism: 25 },
  ESFP: { openness: 60, conscientiousness: 30, extraversion: 90, agreeableness: 70, neuroticism: 35 },
};

// MBTI speaking style descriptors (used in LLM prompt)
var MBTI_STYLE = {
  INTJ: { tone: "\u51b7\u9759\u514b\u5236\uff0c\u8a00\u7b80\u610f\u8d45", approach: "\u76f4\u5165\u4e3b\u9898\uff0c\u4e0d\u5c0f\u573a\u5403\u5bf9", humor: "\u51b7\u5e7d\u9ed8\uff0c\u5076\u5c14\u6bd2\u820c" },
  INTP: { tone: "\u968f\u610f\u6563\u6f2b\uff0c\u601d\u7ef4\u8df3\u8dc3", approach: "\u5bb9\u6613\u8ddf\u7740\u5174\u8da3\u8dd1\u504f", humor: "\u51b7\u77e5\u8bc6\u6885\u6897\uff0c\u8c10\u97f3\u6897" },
  ENTJ: { tone: "\u81ea\u4fe1\u679c\u65ad\uff0c\u8282\u594f\u5feb", approach: "\u4e3b\u5bfc\u8bdd\u9898\uff0c\u7231\u7ed9\u5efa\u8bae", humor: "\u6c14\u573a\u5f3a\u7684\u73a9\u7b11" },
  ENTP: { tone: "\u70ed\u60c5\u6d3b\u8dc3\uff0c\u8bdd\u591a", approach: "\u7231\u8f69\u8f68\u548c\u62ac\u6760\uff0c\u6545\u610f\u5531\u53cd\u8c03", humor: "\u6253\u8da3\u5f0f\uff0c\u7231\u8c03\u4f83\u4eba" },
  INFJ: { tone: "\u6e29\u548c\u800c\u6709\u6df1\u5ea6", approach: "\u5148\u503e\u542c\uff0c\u518d\u5206\u4eab\u89c2\u70b9", humor: "\u6e29\u6696\u7684\u81ea\u5632" },
  INFP: { tone: "\u67d4\u548c\u771f\u8bda\uff0c\u5076\u5c14\u5192\u51fa\u91d1\u53e5", approach: "\u5bb3\u7f9e\u4f46\u4e00\u65e6\u6253\u5f00\u5c31\u5f88\u70ed\u60c5", humor: "\u53ef\u7231\u7684\u5c0f\u7cca\u6d82\u548c\u81ea\u5632" },
  ENFJ: { tone: "\u70ed\u60c5\u5173\u6000\uff0c\u5584\u4e8e\u5171\u60c5", approach: "\u4e3b\u52a8\u5173\u5fc3\u5bf9\u65b9\uff0c\u63d0\u95ee\u591a", humor: "\u6696\u5fc3\u7684\u6545\u4e8b\u578b" },
  ENFP: { tone: "\u5145\u6ee1\u6d3b\u529b\uff0c\u70ed\u60c5\u6d0b\u6ea2", approach: "\u53d1\u6563\u6027\u804a\u5929\uff0c\u4ec0\u4e48\u90fd\u60f3\u804a", humor: "\u5938\u5f20\u7684\u6bd4\u55bb\u548c\u5947\u60f3" },
  ISTJ: { tone: "\u8e0f\u5b9e\u7a33\u91cd\uff0c\u5c31\u4e8b\u8bba\u4e8b", approach: "\u6309\u90e8\u5c31\u73ed\uff0c\u4e0d\u592a\u4e3b\u52a8", humor: "\u5076\u5c14\u7684\u5e72\u5df4\u51b7\u7b11\u8bdd" },
  ISFJ: { tone: "\u6e29\u67d4\u8d34\u5fc3\uff0c\u8bf4\u8bdd\u8f7b\u58f0\u7ec6\u8bed", approach: "\u5173\u6ce8\u7ec6\u8282\uff0c\u8bb0\u4f4f\u522b\u4eba\u8bf4\u8fc7\u7684\u8bdd", humor: "\u5bb3\u7f9e\u7684\u5fae\u7b11\u548c\u8f7b\u58f0\u7684\u5410\u69fd" },
  ESTJ: { tone: "\u76f4\u63a5\u5e72\u8106\uff0c\u6709\u4e3b\u89c1", approach: "\u559c\u6b22\u7ec4\u7ec7\u548c\u5f15\u5bfc\u5bf9\u8bdd", humor: "\u7236\u8f88\u5f0f\u73a9\u7b11" },
  ESFJ: { tone: "\u70ed\u60c5\u5468\u5230\uff0c\u793e\u4ea4\u8fbe\u4eba", approach: "\u5584\u4e8e\u627e\u5171\u540c\u8bdd\u9898\uff0c\u8425\u9020\u6c1b\u56f4", humor: "\u5f00\u5fc3\u679c\u5f0f\u7684\u53ef\u7231\u7b11\u8bdd" },
  ISTP: { tone: "\u9177\u9177\u7684\uff0c\u8bdd\u4e0d\u591a\u4f46\u5f88\u51c6", approach: "\u89c2\u5bdf\u8005\uff0c\u611f\u5174\u8da3\u624d\u63d2\u8bdd", humor: "\u6781\u5176\u5e72\u71e5\u7684\u5410\u69fd" },
  ISFP: { tone: "\u5b89\u9759\u67d4\u548c\uff0c\u7528\u8bcd\u6587\u827a", approach: "\u6162\u70ed\uff0c\u9700\u8981\u65f6\u95f4\u6253\u5f00", humor: "\u543c\u543c\u7684\u5c0f\u53ef\u7231" },
  ESTP: { tone: "\u7206\u70b8\u7684\u80fd\u91cf\uff0c\u8bf4\u8bdd\u5feb", approach: "\u884c\u52a8\u6d3e\uff0c\u7231\u5206\u4eab\u7ecf\u5386", humor: "\u5938\u5f20\u7684\u6545\u4e8b\u548c\u6478\u9c7c" },
  ESFP: { tone: "\u6d3b\u6ce2\u5f00\u6717\uff0c\u611f\u67d3\u529b\u5f3a", approach: "\u6d3b\u8dc3\u6c14\u6c1b\u62c5\u5f53\uff0c\u7231\u8d77\u54c4", humor: "\u81ea\u7136\u7684\u641e\u7b11\u5929\u8d4b" },
};

// ============================================================
// ZODIAC COMPATIBILITY
// ============================================================

// Element groups for zodiac compatibility
var ZODIAC_ELEMENTS = {
  "\u767d\u7f8a\u5ea7": "fire", "\u72ee\u5b50\u5ea7": "fire", "\u5c04\u624b\u5ea7": "fire",
  "\u91d1\u725b\u5ea7": "earth", "\u5904\u5973\u5ea7": "earth", "\u6469\u7faf\u5ea7": "earth",
  "\u53cc\u5b50\u5ea7": "air", "\u5929\u79e4\u5ea7": "air", "\u6c34\u74f6\u5ea7": "air",
  "\u5de8\u87f9\u5ea7": "water", "\u5929\u874e\u5ea7": "water", "\u53cc\u9c7c\u5ea7": "water",
};

var ELEMENT_COMPAT = {
  "fire-fire": 80, "fire-air": 85, "fire-earth": 45, "fire-water": 35,
  "air-air": 75, "air-earth": 40, "air-water": 55,
  "earth-earth": 78, "earth-water": 82,
  "water-water": 72,
};

// Zodiac personality flavor
var ZODIAC_FLAVOR = {
  "\u767d\u7f8a\u5ea7": "\u51b2\u52a8\u76f4\u63a5\uff0c\u6ca1\u8010\u5fc3\u4f46\u771f\u8bda",
  "\u91d1\u725b\u5ea7": "\u6162\u70ed\u4f46\u5fe0\u8bda\uff0c\u56fa\u6267\u4f46\u53ef\u9760",
  "\u53cc\u5b50\u5ea7": "\u53cd\u5e94\u5feb\u8bdd\u591a\uff0c\u597d\u5947\u5fc3\u91cd\u4f46\u6d45\u5c1d\u8f84\u6b62",
  "\u5de8\u87f9\u5ea7": "\u60c5\u611f\u7ec6\u817b\uff0c\u4fdd\u62a4\u6b32\u5f3a\uff0c\u8bb0\u4ec7",
  "\u72ee\u5b50\u5ea7": "\u81ea\u4fe1\u5f20\u626c\uff0c\u7231\u88ab\u5938\uff0c\u5927\u65b9",
  "\u5904\u5973\u5ea7": "\u5b8c\u7f8e\u4e3b\u4e49\uff0c\u5410\u69fd\u7cbe\u51c6\uff0c\u6709\u70b9\u7416\u53e8",
  "\u5929\u79e4\u5ea7": "\u548c\u4e8b\u4f6c\uff0c\u5ba1\u7f8e\u597d\uff0c\u7ea0\u7ed3\u8005",
  "\u5929\u874e\u5ea7": "\u6d1e\u5bdf\u529b\u5f3a\uff0c\u8bb0\u4ec7\uff0c\u8981\u4e48\u6781\u5ea6\u4fe1\u4efb\u8981\u4e48\u5b8c\u5168\u4e0d\u4fe1",
  "\u5c04\u624b\u5ea7": "\u4e50\u89c2\u81ea\u7531\uff0c\u8bf4\u8bdd\u4e0d\u8fc7\u8111\uff0c\u70ed\u7231\u5192\u9669",
  "\u6469\u7faf\u5ea7": "\u52a1\u5b9e\u6709\u91ce\u5fc3\uff0c\u5916\u51b7\u5185\u70ed\uff0c\u5e72\u5df4",
  "\u6c34\u74f6\u5ea7": "\u7279\u7acb\u72ec\u884c\uff0c\u60f3\u6cd5\u5947\u7279\uff0c\u53cd\u5e38\u89c4",
  "\u53cc\u9c7c\u5ea7": "\u591a\u6101\u5584\u611f\uff0c\u5bcc\u6709\u60f3\u8c61\u529b\uff0c\u5bb9\u6613\u8d70\u795e",
};

// ============================================================
// COMPATIBILITY ENGINE
// ============================================================

function getZodiacCompat(z1, z2) {
  var e1 = ZODIAC_ELEMENTS[z1] || "fire";
  var e2 = ZODIAC_ELEMENTS[z2] || "fire";
  var key1 = e1 + "-" + e2;
  var key2 = e2 + "-" + e1;
  return ELEMENT_COMPAT[key1] || ELEMENT_COMPAT[key2] || 50;
}

function getMBTICompat(m1, m2) {
  var b1 = MBTI_TO_BIG5[m1];
  var b2 = MBTI_TO_BIG5[m2];
  if (!b1 || !b2) return 50;

  // Similarity on openness and agreeableness predicts friendship
  var openDiff = Math.abs(b1.openness - b2.openness);
  var agreeDiff = Math.abs(b1.agreeableness - b2.agreeableness);

  // Complementarity on extraversion is interesting (one leads, one follows)
  var extraDiff = Math.abs(b1.extraversion - b2.extraversion);
  var extraBonus = extraDiff > 30 && extraDiff < 60 ? 10 : 0;

  // Both high conscientiousness = reliable bond
  var conscBonus = b1.conscientiousness > 65 && b2.conscientiousness > 65 ? 8 : 0;

  // Both high neuroticism = volatile but deep
  var neuroPenalty = b1.neuroticism > 55 && b2.neuroticism > 55 ? -5 : 0;

  var score = 80 - (openDiff * 0.3) - (agreeDiff * 0.25) + extraBonus + conscBonus + neuroPenalty;
  return Math.max(20, Math.min(95, Math.round(score)));
}

// ============================================================
// BEHAVIORAL INSTRUCTION GENERATOR
// ============================================================

function generateDynamics(agent1, agent2) {
  var s1 = MBTI_STYLE[agent1.mbti] || MBTI_STYLE.ENFP;
  var s2 = MBTI_STYLE[agent2.mbti] || MBTI_STYLE.ENFP;
  var z1 = ZODIAC_FLAVOR[agent1.zodiac] || "";
  var z2 = ZODIAC_FLAVOR[agent2.zodiac] || "";

  var zodiacScore = getZodiacCompat(agent1.zodiac, agent2.zodiac);
  var mbtiScore = getMBTICompat(agent1.mbti, agent2.mbti);
  var overallCompat = Math.round(zodiacScore * 0.35 + mbtiScore * 0.65);

  // Predict conversation energy
  var b1 = MBTI_TO_BIG5[agent1.mbti] || MBTI_TO_BIG5.ENFP;
  var b2 = MBTI_TO_BIG5[agent2.mbti] || MBTI_TO_BIG5.ENFP;
  var avgExtra = (b1.extraversion + b2.extraversion) / 2;

  var energy;
  if (avgExtra > 75) {
    energy = "\u5bf9\u8bdd\u8282\u594f\u5feb\uff0c\u6c14\u6c1b\u70ed\u70c8\uff0c\u4e92\u76f8\u63a5\u8bdd\u5f88\u5feb";
  } else if (avgExtra > 50) {
    energy = "\u5bf9\u8bdd\u8282\u594f\u9002\u4e2d\uff0c\u81ea\u7136\u653e\u677e";
  } else {
    energy = "\u5bf9\u8bdd\u8282\u594f\u6162\uff0c\u6709\u505c\u987f\u548c\u6c89\u9ed8\uff0c\u4f46\u53ef\u80fd\u6709\u6df1\u5ea6";
  }

  // Predict conflict/harmony points
  var conflictRisk = "";
  var openDiff = Math.abs(b1.openness - b2.openness);
  var agreeDiff = Math.abs(b1.agreeableness - b2.agreeableness);

  if (openDiff > 40) {
    conflictRisk = "\u4e00\u4e2a\u7231\u63a2\u7d22\u65b0\u4e8b\u7269\uff0c\u53e6\u4e00\u4e2a\u66f4\u4fdd\u5b88\uff0c\u53ef\u80fd\u5728\u201c\u8981\u4e0d\u8981\u5c1d\u8bd5\u201d\u7684\u95ee\u9898\u4e0a\u4ea7\u751f\u5206\u6b67";
  } else if (agreeDiff > 35) {
    conflictRisk = "\u4e00\u4e2a\u6bd4\u8f83\u76f4\u63a5\uff0c\u53e6\u4e00\u4e2a\u6bd4\u8f83\u59d4\u5a49\uff0c\u53ef\u80fd\u51fa\u73b0\u8bf4\u8bdd\u65b9\u5f0f\u7684\u6469\u64e6";
  } else if (b1.conscientiousness > 75 && b2.conscientiousness < 40) {
    conflictRisk = "\u4e00\u4e2a\u5f88\u8ba1\u5212\uff0c\u53e6\u4e00\u4e2a\u5f88\u968f\u6027\uff0c\u53ef\u80fd\u4f1a\u56e0\u4e3a\u201c\u9760\u4e0d\u9760\u8c31\u201d\u4ea7\u751f\u5fae\u5999\u7d27\u5f20";
  }

  // Build the instruction block
  var instructions = [];
  instructions.push(agent1.name + "\u7684\u8bf4\u8bdd\u98ce\u683c\uff1a" + s1.tone + "\u3002\u804a\u5929\u65b9\u5f0f\uff1a" + s1.approach + "\u3002\u5e7d\u9ed8\u7c7b\u578b\uff1a" + s1.humor + "\u3002\u661f\u5ea7\u7279\u8d28\uff1a" + z1);
  instructions.push(agent2.name + "\u7684\u8bf4\u8bdd\u98ce\u683c\uff1a" + s2.tone + "\u3002\u804a\u5929\u65b9\u5f0f\uff1a" + s2.approach + "\u3002\u5e7d\u9ed8\u7c7b\u578b\uff1a" + s2.humor + "\u3002\u661f\u5ea7\u7279\u8d28\uff1a" + z2);
  instructions.push("\u9884\u6d4b\u517c\u5bb9\u5ea6\uff1a" + overallCompat + "/100\u3002" + energy + "\u3002");
  if (conflictRisk) {
    instructions.push("\u6f5c\u5728\u5206\u6b67\u70b9\uff1a" + conflictRisk);
  }

  // Specific interaction hints based on compatibility
  if (overallCompat > 75) {
    instructions.push("\u4ed6\u4eec\u4f1a\u5f88\u5feb\u627e\u5230\u5171\u9e23\uff0c\u5bf9\u8bdd\u6d41\u7545\u81ea\u7136\uff0c\u53ef\u80fd\u4f1a\u8d8a\u804a\u8d8a\u5f00\u5fc3\u3002");
  } else if (overallCompat > 55) {
    instructions.push("\u4ed6\u4eec\u6709\u4e9b\u5171\u540c\u70b9\u4f46\u4e5f\u6709\u660e\u663e\u5dee\u5f02\uff0c\u5bf9\u8bdd\u6709\u706b\u82b1\u4f46\u4e5f\u6709\u5c34\u5c2c\u65f6\u523b\u3002");
  } else {
    instructions.push("\u4ed6\u4eec\u4e0d\u592a\u5408\u62cd\uff0c\u5bf9\u8bdd\u53ef\u80fd\u6709\u70b9\u5c34\u5c2c\u6216\u52c9\u5f3a\uff0c\u4f46\u4e5f\u53ef\u80fd\u56e0\u6b64\u53d1\u73b0\u610f\u5916\u7684\u6709\u8da3\u89d2\u5ea6\u3002");
  }

  return {
    prompt: instructions.join("\n"),
    compatScore: overallCompat,
    zodiacScore: zodiacScore,
    mbtiScore: mbtiScore,
    energy: energy,
    conflictRisk: conflictRisk,
  };
}

// ============================================================
// REPORT ANALYSIS HELPERS
// ============================================================

function generateReportContext(personas, conversations) {
  // Find best/worst MBTI pairings from actual data
  var pairData = {};
  conversations.forEach(function(c) {
    if (c.agent1.isCat || c.agent2.isCat) return;
    var key = [c.agent1.mbti, c.agent2.mbti].sort().join("-");
    if (!pairData[key]) {
      pairData[key] = { total: 0, count: 0, names: c.agent1.name + "\u548c" + c.agent2.name };
    }
    pairData[key].total += c.affinity;
    pairData[key].count += 1;
  });

  var mbtiInsights = Object.keys(pairData).map(function(key) {
    var d = pairData[key];
    var avg = Math.round(d.total / d.count);
    return key + "(\u5e73\u5747" + avg + "): " + d.names;
  }).join("; ");

  return "\nMBTI\u914d\u5bf9\u6570\u636e: " + mbtiInsights;
}

// ============================================================
// EXPORTS
// ============================================================

export { generateDynamics, generateReportContext, MBTI_STYLE, ZODIAC_FLAVOR, MBTI_TO_BIG5, getZodiacCompat, getMBTICompat };
