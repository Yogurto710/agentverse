import { useState, useEffect, useRef } from "react";
import { generateDynamics } from "./personality.js";

const FONT = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;800&family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap";

const C = {
  bg: "#0e1526",
  surface: "#141e34",
  surfaceHover: "#1a2844",
  border: "#2a3f66",
  goldDim: "#8a7435",
  text: "#e8e0d4",
  textDim: "#8a9ab4",
  textMuted: "#4a5a74",
  gold: "#d4aa44",
  goldBright: "#f0cc60",
  accent: "#6fd4e8",
};

const EL = {
  anemo: { color: "#74c7a8", icon: "\u25ce" },
  pyro: { color: "#e8784a", icon: "\u25c6" },
  electro: { color: "#b48de8", icon: "\u25c7" },
  hydro: { color: "#4aa8e8", icon: "\u25cb" },
  geo: { color: "#d4a844", icon: "\u25a1" },
  cryo: { color: "#9ae4f4", icon: "\u2727" },
  dendro: { color: "#7cc444", icon: "\u274b" },
  stellar: { color: "#f4c874", icon: "\u2605" },
};

var MBTI_LIST = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
var ZODIAC_LIST = ["\u767d\u7f8a\u5ea7","\u91d1\u725b\u5ea7","\u53cc\u5b50\u5ea7","\u5de8\u87f9\u5ea7","\u72ee\u5b50\u5ea7","\u5904\u5973\u5ea7","\u5929\u79e4\u5ea7","\u5929\u874e\u5ea7","\u5c04\u624b\u5ea7","\u6469\u7faf\u5ea7","\u6c34\u74f6\u5ea7","\u53cc\u9c7c\u5ea7"];
var GENDER_LIST = ["\u7537", "\u5973"];

var MAX_ENC = 7;

function useWindowSize() {
  var s = useState({ w: typeof window !== "undefined" ? window.innerWidth : 1280, h: typeof window !== "undefined" ? window.innerHeight : 800 });
  var size = s[0]; var setSize = s[1];
  useEffect(function() {
    function upd() { setSize({ w: window.innerWidth, h: window.innerHeight }); }
    window.addEventListener("resize", upd);
    window.addEventListener("orientationchange", function() { setTimeout(upd, 150); });
    return function() { window.removeEventListener("resize", upd); };
  }, []);
  return size;
}

var SPEED = 0.05;
var D8 = (function() {
  var d = [];
  for (var i = 0; i < 8; i++) {
    var a = i * Math.PI / 4;
    d.push({ dx: Math.cos(a), dy: Math.sin(a) });
  }
  return d;
})();
// Cardinal-only legacy (kept for lookahead helpers)
var DIRS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

// Center 70% of map is walkable (x: 15–85, y: 15–85)
function isWalkable(x, y) {
  return x >= 15 && x <= 85 && y >= 15 && y <= 85;
}

// Quadrant system: map divided into 4 quadrants (TL=0, TR=1, BL=2, BR=3)
function getQuadrant(x, y) {
  return (x >= 50 ? 1 : 0) + (y >= 50 ? 2 : 0);
}
var QUAD_CENTERS = [
  { x: 25, y: 25 }, { x: 75, y: 25 },
  { x: 25, y: 75 }, { x: 75, y: 75 },
];
function quadrantCounts(ags) {
  var c = [0, 0, 0, 0];
  for (var i = 0; i < ags.length; i++) c[getQuadrant(ags[i].x, ags[i].y)]++;
  return c;
}

var NPC_DATA = [
  { id: 1, name: "\u5c0f\u7ea2", role: "\u5ca9\u58c1\u7cbe\u7075", element: "pyro", mbti: "ENFP", zodiac: "\u5c04\u624b\u5ea7", gender: "\u5973", bio: "\u62b1\u77f3\u5708\u5377\u738b\uff0cV6\u4fe1\u624b\u62c8\u6765\u3002\u767d\u5929\u722c\u5899\u665a\u4e0a\u7801\u5b57\uff0c\u5728\u5199\u4e00\u672c\u4e1c\u65b9\u795e\u8bdd\u5947\u5e7b\u5c0f\u8bf4\u3002", interests: ["\u62b1\u77f3\u6500\u5ca9","\u5947\u5e7b\u5199\u4f5c","\u9732\u8425","\u4e1c\u65b9\u795e\u8bdd","\u51b7\u7b11\u8bdd"], hair: "#cc4455", outfit: "#8a2233" },
  { id: 2, name: "\u5927\u660e", role: "\u684c\u6e38\u6559\u4e3b", element: "geo", mbti: "ESTP", zodiac: "\u72ee\u5b50\u5ea7", gender: "\u7537", bio: "\u5bb6\u91cc200+\u684c\u6e38\uff0c\u6bcf\u5468\u7ec4\u5267\u672c\u6740\u3002\u81ea\u5236\u8fa3\u9171\u72ec\u5bb6\u914d\u65b9\u3002", interests: ["\u684c\u6e38","\u5267\u672c\u6740","\u8fa3\u9171\u917f\u9020","\u7bee\u7403","\u8bf7\u5ba2\u5403\u996d"], hair: "#3a2a1a", outfit: "#8a7733" },
  { id: 3, name: "\u963f\u6811", role: "\u690d\u7269\u623f\u4e1c", element: "dendro", mbti: "ISFP", zodiac: "\u91d1\u725b\u5ea7", gender: "\u7537", bio: "\u9633\u53f0\u53d8\u70ed\u5e26\u96e8\u6797\uff0c47\u76c6\u690d\u7269\u6bcf\u68f5\u6709\u540d\u5b57\u3002\u9a91\u6b7b\u98de\u901a\u52e4\u98ce\u96e8\u65e0\u963b\u3002", interests: ["\u690d\u7269\u517b\u62a4","\u9a91\u884c","\u9178\u9762\u56e2","\u64ad\u5ba2","\u9633\u53f0\u82b1\u56ed"], hair: "#5a7a3a", outfit: "#3a5a2a" },
  { id: 4, name: "\u96c5\u96c5", role: "\u4e2d\u53e4\u5973\u738b", element: "electro", mbti: "ENTP", zodiac: "\u53cc\u5b50\u5ea7", gender: "\u5973", bio: "\u80fd\u5728\u4efb\u4f55\u57ce\u5e02\u627e\u5230vintage\u5e97\u3002\u5728Livehouse\u653e\u7535\u5b50\u4e50\uff0c\u5bf9\u624b\u51b2\u5496\u5561\u6709\u6267\u5ff5\u3002", interests: ["\u4e2d\u53e4\u6dd8\u5b9d","\u7535\u5b50\u97f3\u4e50","\u624b\u51b2\u5496\u5561","\u6c49\u670d","\u6d82\u9e26"], hair: "#6a3a7a", outfit: "#5a2a6a" },
  { id: 5, name: "\u8001\u9648", role: "\u8ffd\u661f\u661f\u7684\u4eba", element: "cryo", mbti: "INTJ", zodiac: "\u6469\u7faf\u5ea7", gender: "\u7537", bio: "\u4e3a\u770b\u94f6\u6cb3\u5f00\u56db\u5c0f\u65f6\u591c\u8f66\u3002\u81ea\u5236\u671b\u8fdc\u955c\u62ff\u8fc7\u5929\u6587\u6444\u5f71\u5956\u3002\u56f4\u68cb\u4e1a\u4f59\u4e94\u6bb5\u3002", interests: ["\u5929\u6587\u6444\u5f71","\u671b\u8fdc\u955cDIY","\u56f4\u68cb","\u586b\u5b57\u6e38\u620f","\u53e4\u6cd5\u5496\u55b1"], hair: "#2a3a5a", outfit: "#3a5a7a" },
  { id: 6, name: "\u5f64\u5f64", role: "\u6bdb\u5b69\u5988\u5988", element: "hydro", mbti: "ISFJ", zodiac: "\u5de8\u87f9\u5ea7", gender: "\u5973", bio: "\u6551\u52a9\u4e86\u4e24\u53ea\u9000\u5f79\u8d5b\u72ac\u3002\u5907\u6218\u7b2c\u4e09\u4e2a\u9a6c\u62c9\u677e\u3002\u5468\u65e5\u505a\u9676\u827a\u3002", interests: ["\u8dd1\u6b65","\u6d41\u6d6a\u52a8\u7269\u6551\u52a9","\u9676\u827a","\u60ac\u7591\u64ad\u5ba2","\u8d8a\u91ce\u8dd1"], hair: "#4a6a8a", outfit: "#2a4a6a" },
  { id: 7, name: "\u98ce\u54e5", role: "\u6ed1\u677f\u5c11\u5e74", element: "pyro", mbti: "ESFP", zodiac: "\u767d\u7f8a\u5ea7", gender: "\u7537", bio: "32\u5c81\u8fd8\u5728\u73a9\u6ed1\u677f\u3002\u6bcf\u5230\u4e00\u4e2a\u57ce\u5e02\u5148\u627e\u8857\u8fb9\u5c0f\u5403\u3002\u4ece\u4e0d\u6f14\u51fa\u7684\u4e50\u961f\u8d1d\u65af\u624b\u3002", interests: ["\u6ed1\u677f","\u8857\u8fb9\u7f8e\u98df","\u8d1d\u65af","\u7403\u978b\u6536\u96c6","lo-fi\u97f3\u4e50"], hair: "#8a4a2a", outfit: "#aa5533" },
  { id: 8, name: "\u56e2\u5b50", role: "\u5e7f\u573a\u795e\u732b", isCat: true, element: "stellar", mbti: "INTP", zodiac: "\u5929\u874e\u5ea7", gender: "\u5176\u4ed6", bio: "\u5e7f\u573a\u9547\u573a\u4e4b\u732b\u3002", interests: ["\u6652\u592a\u9633","\u6253\u76f9","\u55b5"], hair: "#dd8833", outfit: "#ffcc88" },
];

/* ---- Avatar ---- */
function Avatar({ persona, size, glow }) {
  var s = size || 40;
  var el = EL[persona.element];
  var glowStyle = glow
    ? { filter: "drop-shadow(0 0 10px " + el.color + "88)" }
    : { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" };
  return (
    <img
      src={"/avatars/" + persona.id + (persona.isUser ? (persona.gender === "\u5973" ? "-fe" : "-ma") : "") + ".png"}
      width={s}
      height={s}
      style={Object.assign({ imageRendering: "pixelated", objectFit: "contain" }, glowStyle)}
      alt={persona.name}
    />
  );
}

/* ---- Improved Map ---- */
function TownMap() {
  return (
    <img src="/map.png" alt="map" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} />
  );
}

/* ---- Small components ---- */
function Bubble({ text, color }) {
  if (!text) return null;
  return (
    <div style={{ position: "absolute", bottom: "120%", left: "50%", transform: "translateX(-50%)", background: C.surface + "f0", border: "1px solid " + C.goldDim + "88", padding: "6px 14px", fontSize: 13, fontFamily: "'Noto Sans SC'", color: C.text, width: 240, whiteSpace: "normal", lineHeight: 1.7, pointerEvents: "none", zIndex: 20, textAlign: "center" }}>
      <span style={{ fontWeight: 600, color: color, fontSize: 12, marginRight: 4 }}>{text.speaker}:</span>
      {text.text}
      <div style={{ position: "absolute", bottom: -6, left: "50%", marginLeft: -5, width: 10, height: 10, background: C.surface + "f0", border: "1px solid " + C.goldDim + "88", borderTop: "none", borderLeft: "none", transform: "rotate(45deg)" }} />
    </div>
  );
}

function ConvCard({ conv, isLatest }) {
  var initOpen = isLatest;
  var stateArr = useState(initOpen);
  var open = stateArr[0];
  var setOpen = stateArr[1];
  useEffect(function() { if (isLatest) setOpen(true); }, [isLatest]);
  var el1 = EL[conv.agent1.element];
  var el2 = EL[conv.agent2.element];
  var isCat = conv.agent1.isCat || conv.agent2.isCat;

  return (
    <div style={{ padding: "7px 14px", background: isLatest ? C.surfaceHover : "transparent", borderBottom: "1px solid " + C.border + "33", cursor: "pointer" }} onClick={function() { setOpen(!open); }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: open ? 4 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: el1.color, fontSize: 9 }}>{el1.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: el1.color }}>{conv.agent1.name}</span>
          <span style={{ fontSize: 8, color: C.textMuted }}>{"\u00b7"}</span>
          <span style={{ color: el2.color, fontSize: 9 }}>{el2.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: el2.color }}>{conv.agent2.name}</span>
        </div>
        <div style={{ fontSize: 10, color: isCat ? "#f4c874" : conv.affinity > 70 ? C.goldBright : C.textMuted }}>
          {isCat ? "~\u55b5~" : conv.affinity}
        </div>
      </div>
      {open && (
        <div>
          <div style={{ fontSize: 10, fontFamily: "'Noto Serif SC'", color: C.gold, marginBottom: 4, fontStyle: "italic", opacity: 0.8 }}>{conv.spark}</div>
          {conv.exchanges.map(function(ex, i) {
            var agent = ex.speaker === conv.agent1.name ? conv.agent1 : conv.agent2;
            var el = EL[agent.element];
            return (
              <div key={i} style={{ display: "flex", gap: 4, marginBottom: 2, alignItems: "flex-start" }}>
                <span style={{ fontSize: 7, color: el.color, marginTop: 4 }}>{el.icon}</span>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: el.color, marginRight: 3 }}>{ex.speaker}</span>
                  <span style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{ex.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Intro ---- */
function IntroScreen({ onStart }) {
  var hovS = useState(false); var hov = hovS[0]; var setHov = hovS[1];
  var nameS = useState(""); var name = nameS[0]; var setName = nameS[1];
  var mbtiS = useState(""); var mbti = mbtiS[0]; var setMbti = mbtiS[1];
  var zodS = useState(""); var zodiac = zodS[0]; var setZodiac = zodS[1];
  var genS = useState(""); var gender = genS[0]; var setGender = genS[1];
  var ok = name.trim() && mbti && zodiac && gender;

  function mkSel(val, opts, setter) {
    return (
      <select value={val} onChange={function(e) { setter(e.target.value); }} style={{ padding: "8px 10px", fontSize: 13, fontFamily: "'Noto Sans SC'", background: C.surface, color: C.text, border: "1px solid " + C.border, borderRadius: 0, outline: "none", cursor: "pointer", width: "100%" }}>
        <option value="" disabled>{"\u9009\u62e9..."}</option>
        {opts.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
      </select>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100dvh", padding: "32px 20px", textAlign: "center", background: "radial-gradient(ellipse at 50% 30%, #1a2a4a 0%, " + C.bg + " 70%)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ fontSize: 12, fontFamily: "'Cinzel'", color: C.gold, letterSpacing: 8, marginBottom: 16, opacity: 0.8 }}>SOCIAL INTELLIGENCE DEMO</div>
      <h1 style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Cinzel'", color: C.goldBright, margin: 0, letterSpacing: 4 }}>AgentVerse</h1>
      <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, transparent, " + C.gold + ", transparent)", margin: "12px auto" }} />
      <p style={{ fontSize: 15, fontFamily: "'Noto Serif SC'", color: C.textDim, maxWidth: 480, margin: "10px 0 6px", lineHeight: 2 }}>
        {"\u8d4b\u4e88AI\u771f\u5b9e\u4eba\u683c\uff0c\u8ba9\u5b83\u4eec\u5728\u5c0f\u9547\u4e0a\u6f2b\u6b65\u3001\u95f2\u804a\uff0c\u53d1\u73b0\u672a\u66fe\u9884\u6599\u7684\u793e\u4ea4\u7f18\u5206\u3002"}
      </p>
      <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 24px" }}>
        {"\u89c2\u5bdf " + MAX_ENC + " \u6b21\u90c2\u9005\u540e\uff0cAI\u5c06\u751f\u6210\u793e\u4ea4\u60c5\u62a5\u5206\u6790\u3002"}
      </p>

      <div style={{ background: C.surface, border: "1px solid " + C.goldDim + "44", padding: "20px 24px", maxWidth: 400, width: "100%", marginBottom: 20, textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: 2, marginBottom: 14, textAlign: "center" }}>{"\u25c8 \u521b\u5efa\u4f60\u7684\u89d2\u8272"}</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 3 }}>{"\u540d\u5b57"}</div>
          <input value={name} onChange={function(e) { setName(e.target.value); }} placeholder={"\u8f93\u5165\u4f60\u7684\u540d\u5b57..."} maxLength={8} style={{ padding: "8px 12px", fontSize: 13, fontFamily: "'Noto Sans SC'", background: C.surface, color: C.text, border: "1px solid " + C.border, borderRadius: 0, outline: "none", width: "100%" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 3 }}>MBTI</div>
            {mkSel(mbti, MBTI_LIST, setMbti)}
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 3 }}>{"\u661f\u5ea7"}</div>
            {mkSel(zodiac, ZODIAC_LIST, setZodiac)}
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 3 }}>{"\u6027\u522b"}</div>
            {mkSel(gender, GENDER_LIST, setGender)}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 28, maxWidth: 540 }}>
        {NPC_DATA.map(function(p) {
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", background: C.surface + "99", border: "1px solid " + C.border + "44", fontSize: 10, color: C.textDim }}>
              <span style={{ color: EL[p.element].color, fontSize: 8 }}>{EL[p.element].icon}</span>
              {p.name}
              <span style={{ fontSize: 8, color: C.textMuted }}>{p.mbti + "\u00b7" + p.zodiac}</span>
              {p.isCat && <span>{"\ud83d\udc31"}</span>}
            </div>
          );
        })}
      </div>

      <button
        onClick={function() { if (ok) onStart({ name: name.trim(), mbti: mbti, zodiac: zodiac, gender: gender }); }}
        onMouseEnter={function() { setHov(true); }}
        onMouseLeave={function() { setHov(false); }}
        style={{ padding: "12px 40px", fontSize: 14, fontFamily: "'Noto Serif SC'", border: "2px solid " + (ok ? C.gold : C.border), borderRadius: 0, background: hov && ok ? C.gold : "transparent", color: hov && ok ? C.bg : ok ? C.gold : C.textMuted, cursor: ok ? "pointer" : "default", transition: "all 0.25s ease", letterSpacing: 4, opacity: ok ? 1 : 0.5 }}
      >
        {"\u5f00\u59cb\u65c5\u9014"}
      </button>
    </div>
  );
}

/* ---- End ---- */
function EndScreen({ conversations, mochiPets, personas, onRestart }) {
  var reportS = useState(null); var report = reportS[0]; var setReport = reportS[1];
  var loadS = useState(true); var loading = loadS[0]; var setLoading = loadS[1];
  var hovS = useState(false); var hov = hovS[0]; var setHov = hovS[1];

  var nonCat = conversations.filter(function(c) { return !c.agent1.isCat && !c.agent2.isCat; });
  var player = personas[0];
  var playerConvs = nonCat.filter(function(c) { return c.agent1.isUser || c.agent2.isUser; });
  var metNames = [];
  playerConvs.forEach(function(c) {
    var n = c.agent1.isUser ? c.agent2.name : c.agent1.name;
    if (metNames.indexOf(n) === -1) metNames.push(n);
  });
  var mochiMsg = mochiPets === 0 ? "\u56e2\u5b50\u9ad8\u51b7\u5730\u65e0\u89c6\u4e86\u6240\u6709\u4eba\u3002" : mochiPets <= 3 ? "\u56e2\u5b50\u77dc\u6301\u5730\u63a5\u53d7\u4e86\u5c11\u91cf\u629a\u6478\u3002" : mochiPets <= 6 ? "\u56e2\u5b50\u610f\u5916\u53d7\u6b22\u8fce\uff0c\u9891\u9891\u88ab\u64b8\u3002" : "\u56e2\u5b50\u6210\u4e3a\u5e7f\u573a\u7edd\u5bf9\u4e3b\u89d2\uff01";

  useEffect(function() { doReport(); }, []);

  function doReport() {
    var pMet = playerConvs.map(function(c) {
      var o = c.agent1.isUser ? c.agent2 : c.agent1;
      var transcript = c.exchanges.map(function(e) { return e.speaker + "：" + e.text; }).join("\n");
      return "【与" + o.name + "的对话】（缘分值 " + c.affinity + "）\n" + transcript;
    }).join("\n\n");

    fetch("/api/npc-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        temperature: 0.7,
        messages: [
          { role: "system", content: "你是社交体验叙事师。根据玩家与角色的真实对话内容，生成有感情、有细节的总结。不要提及MBTI代码或星座名称，用具体的言行细节来描述人物和关系。中文，语气自然真实。\n\n输出纯JSON：\n{\"title\":\"<15字，有意境的标题>\",\"bestMatch\":{\"names\":\"<两名字>\",\"reason\":\"<40字，基于实际互动描述为何合拍>\"},\"surprise\":{\"names\":\"<两名字>\",\"reason\":\"<40字，描述出人意料的化学反应>\"},\"loneliest\":{\"name\":\"<名字>\",\"reason\":\"<30字，用具体细节描述疏离感>\"},\"impressions\":[{\"name\":\"<角色名>\",\"impression\":\"<60字以内，第一人称，引用对话中具体说过的话或细节，写出这个人给你留下的真实印象>\"}],\"overall\":\"<70字以内，基于这次游历的真实感受，有温度，有细节>\"}" },
          { role: "user", content: player.name + "在小镇广场的对话记录：\n\n" + pMet + (mochiPets > 0 ? "\n\n（顺带一提，团子被抚摸了" + mochiPets + "次。）" : "") + "\n\n请为" + player.name + "生成对每个人的印象，以及整体游历的总结。" }
        ]
      })
    }).then(function(r) { return r.json(); }).then(function(d) {
      var raw = d.choices[0].message.content;
      setReport(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    }).catch(function() {
      setReport({ title: "\u7f18\u5206\u5929\u6ce8\u5b9a", bestMatch: { names: "...", reason: "\u89e3\u6790\u5931\u8d25" }, surprise: { names: "...", reason: "..." }, loneliest: { name: "...", reason: "..." }, impressions: [], overall: "\u4e00\u6b21\u6709\u8da3\u7684\u5b9e\u9a8c\u3002" });
    }).finally(function() { setLoading(false); });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: 14, color: C.gold, animation: "pulse 1.5s infinite" }}>{"\u2726 \u6b63\u5728\u751f\u6210\u793e\u4ea4\u60c5\u62a5..."}</div>
      </div>
    );
  }

  if (!report) return null;

  var cards = [
    { ico: "\ud83e\udd1d", title: "\u6700\u4f73\u62cd\u6863", data: report.bestMatch, col: C.gold },
    { ico: "\u26a1", title: "\u610f\u5916\u7ec4\u5408", data: report.surprise, col: C.accent },
    { ico: "\ud83c\udf19", title: "\u6700\u5b64\u72ec\u7684\u7075\u9b42", data: { names: report.loneliest.name, reason: report.loneliest.reason }, col: C.textMuted },
  ];

  return (
    <div style={{ minHeight: "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "radial-gradient(ellipse at 50% 30%, #1a2a4a 0%, " + C.bg + " 70%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px" }}>
      <div style={{ maxWidth: 580, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontFamily: "'Cinzel'", color: C.goldDim, letterSpacing: 6, marginBottom: 12 }}>SIMULATION COMPLETE</div>
        <h1 style={{ fontSize: 32, fontFamily: "'Cinzel'", color: C.goldBright, margin: "0 0 20px" }}>{"\u300c" + report.title + "\u300d"}</h1>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>{nonCat.length + "\u6b21\u5bf9\u8bdd \u00b7 " + playerConvs.length + "\u4eba\u5df2\u9047\u89c1"}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, textAlign: "left" }}>
          {cards.map(function(c, i) {
            return (
              <div key={i} style={{ background: C.surface, border: "1px solid " + c.col + "33", padding: "12px 16px" }}>
                <div style={{ fontSize: 10, color: c.col, fontWeight: 700, letterSpacing: 2, marginBottom: 5 }}>{c.ico + " " + c.title}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 3 }}>{c.data.names}</div>
                <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>{c.data.reason}</div>
              </div>
            );
          })}

          {report.impressions && report.impressions.length > 0 && (
            <div style={{ background: C.surface, border: "1px solid " + EL.anemo.color + "22", padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: EL.anemo.color, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>{"\ud83d\udcdd " + player.name + "\u7684\u793e\u4ea4\u65e5\u8bb0"}</div>
              {report.impressions.map(function(imp, i) {
                var p = personas.find(function(pp) { return pp.name === imp.name; });
                var el = p ? EL[p.element] : EL.anemo;
                var conv = playerConvs.find(function(c) {
                  return c.agent1.name === imp.name || c.agent2.name === imp.name;
                });
                var aff = conv ? conv.affinity : null;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: i < report.impressions.length - 1 ? "1px solid " + C.border + "22" : "none" }}>
                    {p && <Avatar persona={p} size={28} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: el.color }}>
                          {imp.name} <span style={{ fontSize: 9, color: C.textMuted, fontWeight: 400 }}>{p ? p.mbti + "\u00b7" + p.zodiac : ""}</span>
                        </div>
                        {aff !== null && <span style={{ fontSize: 13, fontFamily: "'Cinzel'", fontWeight: 700, color: aff > 70 ? C.goldBright : C.textMuted }}>{aff}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6, marginTop: 2 }}>{"\u201c" + imp.impression + "\u201d"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ background: C.surface, border: "1px solid #f4c87433", padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#f4c874", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>{"\ud83d\udc31 \u56e2\u5b50\u7684\u4e00\u5929"}</div>
            <Avatar persona={NPC_DATA[7]} size={44} glow={true} />
            <div style={{ fontSize: 28, fontFamily: "'Cinzel'", fontWeight: 800, color: "#f4c874", margin: "6px 0 2px" }}>{mochiPets}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{"\u6b21\u88ab\u64b8"}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{mochiMsg}</div>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "16px 20px", background: C.surfaceHover + "88", border: "1px solid " + C.goldDim + "33", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontFamily: "'Noto Serif SC'", color: C.text, lineHeight: 2, fontStyle: "italic" }}>{"\u300c" + report.overall + "\u300d"}</div>
        </div>

        <button onClick={onRestart} onMouseEnter={function() { setHov(true); }} onMouseLeave={function() { setHov(false); }} style={{ padding: "12px 36px", fontSize: 14, fontFamily: "'Noto Serif SC'", border: "2px solid " + C.gold, borderRadius: 0, background: hov ? C.gold : "transparent", color: hov ? C.bg : C.gold, cursor: "pointer", transition: "all 0.25s ease", letterSpacing: 3, marginBottom: 20 }}>
          {"\u518d\u6765\u4e00\u5c40"}
        </button>
      </div>
    </div>
  );
}

/* ---- Main ---- */
export default function AgentVerse() {
  var phaseS = useState("intro"); var phase = phaseS[0]; var setPhase = phaseS[1];
  var personasS = useState([]); var personas = personasS[0]; var setPersonas = personasS[1];
  var agentsS = useState([]); var agents = agentsS[0]; var setAgents = agentsS[1];
  var convsS = useState([]); var conversations = convsS[0]; var setConversations = convsS[1];
  var affS = useState({}); var affinities = affS[0]; var setAffinities = affS[1];
  var talkS = useState(null); var talkingPair = talkS[0]; var setTalkingPair = talkS[1];
  var genS = useState(false); var generating = genS[0]; var setGenerating = genS[1];
  var exS = useState(null); var latestEx = exS[0]; var setLatestEx = exS[1];
  var mochiS = useState(0); var mochiPets = mochiS[0]; var setMochiPets = mochiS[1];
  var showLogS = useState(false); var showLog = showLogS[0]; var setShowLog = showLogS[1];
  var activeConvS = useState(null); var activeConv = activeConvS[0]; var setActiveConv = activeConvS[1];
  var userInputS = useState(""); var userInput = userInputS[0]; var setUserInput = userInputS[1];
  var bulletinS = useState([]); var bulletin = bulletinS[0]; var setBulletin = bulletinS[1];
  var panelTabS = useState("log"); var panelTab = panelTabS[0]; var setPanelTab = panelTabS[1];
  var wSz = useWindowSize();
  var isMobile = wSz.w < 768;
  var isTablet = wSz.w >= 768 && wSz.w < 1024;
  var sideW = isMobile ? 0 : isTablet ? 240 : 320;
  var isPortrait = wSz.h > wSz.w;


  var agR = useRef([]);
  var runR = useRef(false);
  var convR = useRef(false);
  var affR = useRef({});
  var frR = useRef(null);
  var cntR = useRef(0);
  var moR = useRef(0);
  var psR = useRef([]);
  var lastNpcPostR = useRef(0);
  var bulletinR = useRef([]);

  useEffect(function() { bulletinR.current = bulletin; }, [bulletin]);

  function buildPersonas(info) {
    var player = {
      id: 0, name: info.name, isUser: true, element: "anemo",
      mbti: info.mbti, zodiac: info.zodiac, gender: info.gender,
      role: info.mbti + "\u00b7" + info.zodiac,
      bio: info.zodiac + "\u7684" + info.mbti + "\uff0c\u6765\u5230\u8499\u5fb7\u5e7f\u573a\u5bfb\u627e\u6709\u8da3\u7684\u7075\u9b42\u3002",
      interests: ["\u63a2\u7d22", "\u4ea4\u670b\u53cb", "\u95f2\u901b"],
      hair: "#2a4a4a", outfit: "#3a7a6a",
    };
    var all = [player].concat(NPC_DATA);
    psR.current = all;
    setPersonas(all);
    return all;
  }

  // Player spawns at center; NPCs arranged in a circle around center
  function spawnPositions(count) {
    var positions = [{ x: 50, y: 50 }]; // player at center
    var npcCount = count - 1;
    var radius = 22;
    for (var i = 0; i < npcCount; i++) {
      var angle = (i / npcCount) * 2 * Math.PI - Math.PI / 2;
      positions.push({
        x: Math.round(50 + radius * Math.cos(angle)),
        y: Math.round(50 + radius * Math.sin(angle)),
      });
    }
    return positions;
  }

  function initAgents(ps) {
    var positions = spawnPositions(ps.length);
    var a = ps.map(function(p, idx) {
      var pos = positions[idx];
      var di = Math.floor(Math.random() * 8);
      var spd = SPEED * (0.8 + Math.random() * 0.4); // ±20% speed variation
      var tdx = D8[di].dx * spd;
      var tdy = D8[di].dy * spd;
      return Object.assign({}, p, pos, {
        dx: tdx, dy: tdy,      // actual velocity (lerped)
        tdx: tdx, tdy: tdy,    // target heading
        _speed: spd,
        stepsLeft: 10 + Math.floor(Math.random() * 25),
        lastTalk: 0, _frozen: false,
        _idlePhase: Math.random() * Math.PI * 2, // for micro-drift
        _metNpcs: {},          // {otherId: {count, lastTs}} — NPC-to-NPC memory
        _lastPost: null,       // {content, ts} — this NPC's most recent bulletin post
      });
    });
    agR.current = a;
    affR.current = {};
    cntR.current = 0;
    moR.current = 0;
    setAgents(a.map(function(x) { return Object.assign({}, x); }));
    setConversations([]);
    setAffinities({});
    setMochiPets(0);
  }

  function startSim(info) {
    var ps = buildPersonas(info);
    initAgents(ps);
    setPhase("running");
  }

  function restart() { setPhase("intro"); }

  function endGame() {
    runR.current = false;
    cancelAnimationFrame(frR.current);
    setPhase("end");
  }

  useEffect(function() {
    if (phase !== "running") return;
    runR.current = true;
    var fc = 0;

    function loop() {
      if (!runR.current) return;
      fc++;
      var ags = agR.current;

      for (var ai = 0; ai < ags.length; ai++) {
        var a = ags[ai];
        var spd = a._speed || SPEED;

        if (a._frozen) continue;

        // --- Pick new target heading when steps run out or wall ahead ---
        var lookahead = 4;
        var wallAhead = !isWalkable(a.x + a.tdx * lookahead / spd, a.y + a.tdy * lookahead / spd);
        if (a.stepsLeft <= 0 || wallAhead) {
          var qCounts = quadrantCounts(ags);
          var myQ = getQuadrant(a.x, a.y);
          var biasTgt = null; // heading bias for direction selection

          if (a.isUser) {
            var unmetByQ = [0, 0, 0, 0];
            for (var uqi = 0; uqi < ags.length; uqi++) {
              var uqag = ags[uqi];
              if (!uqag.isUser && !uqag.isCat && !uqag._metPlayer)
                unmetByQ[getQuadrant(uqag.x, uqag.y)]++;
            }
            var bestQ = myQ, bestUnmet = unmetByQ[myQ];
            for (var bqi = 0; bqi < 4; bqi++) {
              if (unmetByQ[bqi] > bestUnmet) { bestUnmet = unmetByQ[bqi]; bestQ = bqi; }
            }
            if (bestQ !== myQ) biasTgt = QUAD_CENTERS[bestQ];
          } else if (qCounts[myQ] > 2) {
            var minQ = 0;
            for (var mqi = 1; mqi < 4; mqi++) {
              if (qCounts[mqi] < qCounts[minQ]) minQ = mqi;
            }
            biasTgt = QUAD_CENTERS[minQ];
          }

          // Build candidate list from 8 directions
          var curAngle = Math.atan2(a.tdy, a.tdx);
          var candidates = D8.slice().map(function(dir, idx) { return { dir: dir, idx: idx }; });

          if (biasTgt !== null) {
            // Sort by closeness toward bias target
            var bt = biasTgt;
            candidates.sort(function(ca, cb) {
              var dA = Math.abs((a.x + ca.dir.dx * 10) - bt.x) + Math.abs((a.y + ca.dir.dy * 10) - bt.y);
              var dB = Math.abs((a.x + cb.dir.dx * 10) - bt.x) + Math.abs((a.y + cb.dir.dy * 10) - bt.y);
              return dA - dB;
            });
          } else {
            // Arc-bias wander: 60% chance to prefer directions within ±90° of current heading
            var useArc = Math.random() < 0.6;
            candidates.sort(function(ca, cb) {
              if (useArc) {
                var angA = Math.atan2(ca.dir.dy, ca.dir.dx);
                var angB = Math.atan2(cb.dir.dy, cb.dir.dx);
                var diffA = Math.abs(angA - curAngle); if (diffA > Math.PI) diffA = 2 * Math.PI - diffA;
                var diffB = Math.abs(angB - curAngle); if (diffB > Math.PI) diffB = 2 * Math.PI - diffB;
                return diffA - diffB;
              }
              return Math.random() - 0.5;
            });
          }

          // Pick first walkable direction
          for (var di = 0; di < candidates.length; di++) {
            var d = candidates[di].dir;
            if (isWalkable(a.x + d.dx * spd * 5, a.y + d.dy * spd * 5)) {
              a.tdx = d.dx * spd;
              a.tdy = d.dy * spd;
              a.stepsLeft = 15 + Math.floor(Math.random() * 35);
              break;
            }
          }
        }

        // --- Momentum: lerp actual velocity toward target heading ---
        var lerpRate = 0.12;
        a.dx = a.dx + (a.tdx - a.dx) * lerpRate;
        a.dy = a.dy + (a.tdy - a.dy) * lerpRate;

        // --- A: Separation steering — soft repulsion up to 12 units ---
        var SEP_RADIUS = 12;
        var sepX = 0, sepY = 0;
        for (var si = 0; si < ags.length; si++) {
          if (si === ai) continue;
          var other = ags[si];
          var sdx = a.x - other.x, sdy = a.y - other.y;
          var dist2 = sdx * sdx + sdy * sdy;
          if (dist2 < SEP_RADIUS * SEP_RADIUS && dist2 > 0) {
            var dist = Math.sqrt(dist2);
            // Quadratic falloff: strongest when overlapping, fades smoothly to zero at radius
            var strength = (1 - dist / SEP_RADIUS);
            sepX += (sdx / dist) * strength * strength * 0.06;
            sepY += (sdy / dist) * strength * strength * 0.06;
          }
        }

        // --- B: Continuous quadrant pressure — gentle nudge toward open space every frame ---
        var qCtsNow = quadrantCounts(ags);
        var myQNow = getQuadrant(a.x, a.y);
        var pressX = 0, pressY = 0;
        if (qCtsNow[myQNow] > 2) {
          // Find least-populated quadrant and apply a weak constant pull toward its center
          var leastQ = 0;
          for (var lqi = 1; lqi < 4; lqi++) {
            if (qCtsNow[lqi] < qCtsNow[leastQ]) leastQ = lqi;
          }
          var tgt = QUAD_CENTERS[leastQ];
          var pdx = tgt.x - a.x, pdy = tgt.y - a.y;
          var plen = Math.sqrt(pdx * pdx + pdy * pdy);
          if (plen > 0) {
            pressX = (pdx / plen) * 0.015;
            pressY = (pdy / plen) * 0.015;
          }
        }

        // --- Apply movement (velocity + separation + quadrant pressure) ---
        var nx = a.x + a.dx + sepX + pressX;
        var ny = a.y + a.dy + sepY + pressY;
        if (isWalkable(nx, ny)) {
          a.x = nx;
          a.y = ny;
          a.stepsLeft--;
        } else if (isWalkable(nx, a.y)) {
          a.x = nx; a.stepsLeft--;
        } else if (isWalkable(a.x, ny)) {
          a.y = ny; a.stepsLeft--;
        } else {
          a.stepsLeft = 0;
          a.tdx = -a.tdx; a.tdy = -a.tdy; // bounce
        }
      }

      if (fc % 40 === 0) {
        var now = performance.now();

        // Player ↔ NPC conversations (player meets each NPC exactly once)
        if (!convR.current && cntR.current < MAX_ENC) {
          var playerAg = null;
          for (var pi = 0; pi < ags.length; pi++) {
            if (ags[pi].isUser) { playerAg = ags[pi]; break; }
          }
          if (playerAg && !playerAg._frozen && now - playerAg.lastTalk > 5000) {
            for (var j = 0; j < ags.length; j++) {
              if (ags[j].isUser) continue;
              if (ags[j].isCat && playerAg._pettedCat) continue;
              if (!ags[j].isCat && ags[j]._metPlayer) continue;
              var ddx = playerAg.x - ags[j].x;
              var ddy = playerAg.y - ags[j].y;
              var dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (dist < 10 && now - ags[j].lastTalk > 5000) {
                doConv(playerAg, ags[j]);
                break;
              }
            }
          }
        }

        // NPC ↔ cat petting (each NPC may pet the cat once)
        if (!convR.current) {
          var catAg = null;
          for (var ci = 0; ci < ags.length; ci++) {
            if (ags[ci].isCat) { catAg = ags[ci]; break; }
          }
          if (catAg && !catAg._frozen) {
            for (var ni = 0; ni < ags.length; ni++) {
              var npc = ags[ni];
              if (npc.isUser || npc.isCat) continue;
              if (npc._pettedCat || npc._frozen) continue;
              if (now - npc.lastTalk <= 5000) continue;
              var cdx = npc.x - catAg.x;
              var cdy = npc.y - catAg.y;
              if (Math.sqrt(cdx * cdx + cdy * cdy) < 10) {
                doConv(npc, catAg);
                break;
              }
            }
          }
        }

        // NPC bulletin post (at most once every 30 seconds globally)
        if (now - lastNpcPostR.current > 30000) {
          var didNpcPair = false;
          for (var n1i = 0; n1i < ags.length && !didNpcPair; n1i++) {
            var n1ag = ags[n1i];
            if (n1ag.isUser || n1ag.isCat || n1ag._frozen) continue;
            if (now - n1ag.lastTalk <= 8000) continue;
            for (var n2i = n1i + 1; n2i < ags.length && !didNpcPair; n2i++) {
              var n2ag = ags[n2i];
              if (n2ag.isUser || n2ag.isCat || n2ag._frozen) continue;
              if (now - n2ag.lastTalk <= 8000) continue;
              var nndx = n1ag.x - n2ag.x, nndy = n1ag.y - n2ag.y;
              if (Math.sqrt(nndx * nndx + nndy * nndy) < 10) {
                lastNpcPostR.current = now;
                var poster = Math.random() < 0.5 ? n1ag : n2ag;
                doNpcPost(poster, poster === n1ag ? n2ag : n1ag);
                didNpcPair = true;
              }
            }
          }
        }
      }

      if (fc % 3 === 0) {
        setAgents(ags.map(function(a) { return Object.assign({}, a); }));
      }
      frR.current = requestAnimationFrame(loop);
    }

    frR.current = requestAnimationFrame(loop);
    return function() {
      runR.current = false;
      cancelAnimationFrame(frR.current);
    };
  }, [phase]);

  useEffect(function() {
    if (activeConv) setPanelTab("conv");
    else setPanelTab("log");
  }, [activeConv]);

  function extractJSON(raw) {
    var s = raw.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try { return JSON.parse(s); } catch(e) {}
    var m = s.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(e) {} }
    var line = s.match(/"line"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    var warm = s.match(/"warm"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    var cold = s.match(/"cold"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    var wild = s.match(/"wild"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    var vibe = s.match(/"vibe"\s*:\s*(\d)/);
    if (line) return { line: line[1], warm: warm ? warm[1] : "好有意思！", cold: cold ? cold[1] : "哦，是吗。", wild: wild ? wild[1] : "等等，换个话题？", vibe: vibe ? parseInt(vibe[1]) : null };
    return null;
  }

  function fetchWithRetry(body, attempt, onSuccess, onFail) {
    fetch("/api/npc-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.error && d.error.type === "engine_overloaded_error" && attempt < 3) {
          setTimeout(function() { fetchWithRetry(body, attempt + 1, onSuccess, onFail); }, 2000 * attempt);
        } else if (!d.choices) {
          console.error("[fetchWithRetry] unexpected response:", JSON.stringify(d));
          onFail();
        } else {
          onSuccess(d);
        }
      })
      .catch(function() { onFail(); });
  }

  function fetchNpcLine(npc, player, exchanges, dynamicsPrompt, callback) {
    var desc = function(a) {
      return a.name + "（" + a.gender + "，" + a.mbti + "，" + a.zodiac + "）— " + a.bio + "\n兴趣：" + a.interests.join("、");
    };
    var isOpening = exchanges.length === 0;
    var histStr = exchanges.map(function(e) { return e.speaker + ": " + e.text; }).join("\n");
    var jsonFmt = "{\"line\": \"" + npc.name + "说的话（25-40字）\", \"warm\": \"" + player.name + "温暖积极的回应\", \"cold\": \"" + player.name + "冷淡保守的回应\", \"wild\": \"" + player.name + "出人意料的回应（搞笑/反问/岔话题/犀利观点）\", \"vibe\": <1-5，当前对话气场分>}";
    var awareness = getAwarenessContext(npc);
    var feed = bulletinR.current || [];
    var topPost = feed.find(function(p) { return p.author && p.author.id !== npc.id; });
    var hook = topPost
      ? "\n\n【本次对话的社交锚点】" + topPost.author.name + "刚在广场动态上发了：「" + topPost.content + "」。把这条动态当作开场或谈资织进对话——可以评论、八卦、追问、借此换话题、或主动提到" + topPost.author.name + "。这能让对话有共同话题，不要每次都只谈自己的兴趣。"
      : "";
    fetchWithRetry({
      model: "deepseek-v4-flash", temperature: 1.1,
      messages: [
        { role: "system", content: "你扮演" + npc.name + "。你正在和" + player.name + "说话。你只能生成" + npc.name + "的台词，绝对不能生成" + player.name + "的台词。根据性格指导说话：\n" + dynamicsPrompt + "\n\n每条消息25-40字，口语化中文，语气贴合当前开场方式。\n\n【社交编织规则】这是一个有共同社交圈的小广场。如果系统提供了「社交锚点」（最近的动态）或「社交背景」（认识的人、自己发过的帖），请把它当成对话的一部分——评论、八卦、接话、追问都很自然。避免每次都只聊自己的兴趣，让对话有共同话题感。\n\n必须输出且仅输出JSON（不要任何其他文字）:\n" + jsonFmt },
        { role: "user", content: isOpening ? (desc(npc) + awareness + hook + "\n\n你是" + npc.name + "，生成对" + player.name + "的开场白，并提供三种" + player.name + "可能的回应建议。") : (desc(npc) + awareness + hook + "\n\n对话历史:\n" + histStr + "\n\n你是" + npc.name + "，生成你的回复，并提供三种" + player.name + "可能的回应建议（包括一个出人意料的wild选项）。") }
      ]
    }, 1, function(d) {
      var raw = d.choices[0].message.content;
      var parsed = extractJSON(raw);
      if (parsed && parsed.line) { callback(parsed); } else { callback({ line: "……", warm: "好有意思！", cold: "哦，是吗。", wild: "等等，换个话题？", vibe: null }); }
    }, function() { callback({ line: "……", warm: "好有意思！", cold: "哦，是吗。", wild: "等等，换个话题？", vibe: null }); });
  }

  function fetchNpcClosing(npc, player, exchanges, dynamicsPrompt, callback) {
    var histStr = exchanges.map(function(e) { return e.speaker + ": " + e.text; }).join("\n");
    var awareness = getAwarenessContext(npc);
    fetchWithRetry({
      model: "deepseek-v4-flash", temperature: 1.0,
      messages: [
        { role: "system", content: "你扮演" + npc.name + "。你正在和" + player.name + "结束这段对话。你只能生成" + npc.name + "的台词，不能生成" + player.name + "的台词。根据性格指导：\n" + dynamicsPrompt + "\n\n仅输出JSON: {\"line\": \"<" + npc.name + "的25-40字结语>\", \"affinity\": <0-100>, \"spark\": \"<8字以内>\"}" },
        { role: "user", content: "完整对话:\n" + histStr + awareness + "\n\n你是" + npc.name + "，生成你的结语并评估与" + player.name + "的缘分值。" }
      ]
    }, 1, function(d) {
      var raw = d.choices[0].message.content;
      var parsed = extractJSON(raw);
      if (parsed && parsed.line) { callback(parsed); } else { callback({ line: "……", affinity: 50, spark: "萍水相逢" }); }
    }, function() { callback({ line: "……", affinity: 50, spark: "萍水相逢" }); });
  }

  function submitUserLine(text) {
    var conv = activeConv;
    if (!conv || !text.trim()) return;
    setUserInput("");
    var newExchanges = conv.exchanges.concat([{ speaker: conv.player.name, text: text.trim() }]);
    setLatestEx({ exchanges: newExchanges, a1: conv.player, a2: conv.npc });
    if (conv.turnIndex === 1) {
      setActiveConv(Object.assign({}, conv, { exchanges: newExchanges, inputPhase: "loading" }));
      setGenerating(true);
      fetchNpcLine(conv.npc, conv.player, newExchanges, conv.dynamicsPrompt, function(result) {
        var ex3 = newExchanges.concat([{ speaker: conv.npc.name, text: result.line }]);
        setLatestEx({ exchanges: ex3, a1: conv.player, a2: conv.npc });
        setActiveConv(Object.assign({}, conv, { exchanges: ex3, inputPhase: "user", turnIndex: 3, suggestions: { warm: result.warm, cold: result.cold, wild: result.wild }, liveVibe: result.vibe || null }));
        setGenerating(false);
      });
    } else {
      setActiveConv(Object.assign({}, conv, { exchanges: newExchanges, inputPhase: "loading" }));
      setGenerating(true);
      fetchNpcClosing(conv.npc, conv.player, newExchanges, conv.dynamicsPrompt, function(result) {
        var finalEx = newExchanges.concat([{ speaker: conv.npc.name, text: result.line }]);
        var key = Math.min(conv.player.id, conv.npc.id) + "-" + Math.max(conv.player.id, conv.npc.id);
        var newAff = Object.assign({}, affR.current);
        newAff[key] = Math.max(newAff[key] || 0, result.affinity);
        affR.current = newAff;
        setAffinities(newAff);
        conv.npc._metPlayer = true;
        cntR.current += 1;
        setConversations(function(prev) {
          return [{ id: Date.now(), agent1: conv.player, agent2: conv.npc, exchanges: finalEx, affinity: result.affinity, spark: result.spark }].concat(prev);
        });
        setGenerating(false);
        setActiveConv(null);
        setLatestEx({ exchanges: finalEx, a1: conv.player, a2: conv.npc });
        conv.player.lastTalk = performance.now();
        conv.npc.lastTalk = performance.now();
        if (cntR.current >= MAX_ENC) { setTimeout(endGame, 2000); return; }
        setTimeout(function() {
          conv.player._frozen = false;
          conv.npc._frozen = false;
          convR.current = false;
          setTalkingPair(null);
          setLatestEx(null);
        }, 3500);
      });
    }
  }

  // Records an encounter between two NPCs (called from bulletin post + reaction sites)
  function logEncounter(n1, n2) {
    if (!n1 || !n2 || n1.isUser || n2.isUser || n1.isCat || n2.isCat) return;
    if (!n1._metNpcs) n1._metNpcs = {};
    if (!n2._metNpcs) n2._metNpcs = {};
    var now = Date.now();
    var r1 = n1._metNpcs[n2.id] || { count: 0, lastTs: 0 };
    var r2 = n2._metNpcs[n1.id] || { count: 0, lastTs: 0 };
    n1._metNpcs[n2.id] = { count: r1.count + 1, lastTs: now };
    n2._metNpcs[n1.id] = { count: r2.count + 1, lastTs: now };
  }

  // Builds a compact "what this NPC currently knows about the world" block.
  // Data-only — surfaces supply their own directives about how to use it.
  function getAwarenessContext(npc) {
    if (!npc || npc.isUser || npc.isCat) return "";
    var lines = [];
    var now = Date.now();

    if (npc._lastPost && npc._lastPost.content) {
      lines.push("- 你最近发过：「" + npc._lastPost.content + "」");
    }

    if (npc._metNpcs) {
      var known = Object.keys(npc._metNpcs).map(function(idStr) {
        var rec = npc._metNpcs[idStr];
        var other = (agR.current || []).find(function(a) { return String(a.id) === idStr; });
        if (!other) return null;
        var fresh = (now - rec.lastTs) < 90000 ? "刚刚" : "之前";
        return other.name + "（" + fresh + "碰过" + rec.count + "次）";
      }).filter(Boolean);
      if (known.length > 0) {
        lines.push("- 你认识的人：" + known.join("、"));
      }
    }

    var feed = bulletinR.current || [];
    var recent = feed.filter(function(p) { return p.author && p.author.id !== npc.id; }).slice(0, 2);
    if (recent.length > 0) {
      var summary = recent.map(function(p) {
        return p.author.name + "刚发过「" + p.content + "」";
      }).join("；");
      lines.push("- 广场最近的动态：" + summary);
    }

    if (lines.length === 0) return "";
    return "\n\n【你最近的社交背景】\n" + lines.join("\n");
  }

  // Bulletin post mode picker: when this NPC has memory of others, biases ~40%
  // toward gossiping about a specific known NPC, otherwise rolls a standard style.
  function pickPostMode(poster) {
    var STANDARD = ["吐槽日常", "分享兴趣冷知识", "发表争议性观点", "碎碎念", "讲一个冷笑话", "对某件事的真实感受"];
    var metIds = poster._metNpcs ? Object.keys(poster._metNpcs) : [];
    if (metIds.length > 0 && Math.random() < 0.4) {
      var pickId = metIds[Math.floor(Math.random() * metIds.length)];
      var target = (agR.current || []).find(function(a) { return String(a.id) === pickId; });
      if (target) {
        return { mode: "gossip", target: target, rec: poster._metNpcs[pickId] };
      }
    }
    return { mode: STANDARD[Math.floor(Math.random() * STANDARD.length)] };
  }

  function doConv(a1, a2) {
    var hasCat = a1.isCat || a2.isCat;
    convR.current = true;
    a1._frozen = true;
    a2._frozen = true;
    setTalkingPair([a1.id, a2.id]);
    setLatestEx(null);
    setGenerating(true);

    if (hasCat) {
      var cat = a1.isCat ? a1 : a2;
      var human = a1.isCat ? a2 : a1;
      human._pettedCat = true;
      moR.current += 1;
      setMochiPets(moR.current);
      a1.lastTalk = performance.now();
      a2.lastTalk = performance.now();

      var catSparks = ["\u795e\u5723\u7684\u76f8\u9047", "\u88ab\u795e\u732b\u8d50\u798f", "\u547d\u4e2d\u6ce8\u5b9a", "\u7075\u9b42\u88ab\u6cbb\u6108", "\u732b\u7f18\u5929\u6ce8\u5b9a"];
      var pick = function(arr) { return arr[Math.floor(Math.random() * arr.length)]; };

      fetch("/api/npc-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          temperature: 1.2,
          messages: [
            { role: "system", content: "生成一段广场流浪猫与路人的偶遇互动，共4条。严格按照指定说话人顺序，绝对不能搞混说话人。猫的台词只能是猫叫声或*动作描述*，不能说人话。人的台词要体现其个性，可以是语言或*动作描述*；若有近期社交背景，人的台词可以自然带入（比如顺嘴提到刚看到的动态、刚碰过的朋友），让场景更鲜活。输出纯JSON数组：[{\"speaker\":\"名字\",\"text\":\"内容\"},...]，不要其他文字。" },
            { role: "user", content: "猫：" + cat.name + "（广场神猫，高冷慵懒，偶尔亲人，只会喵叫和肢体动作）\n人：" + human.name + "（" + human.mbti + "，" + human.zodiac + "，" + human.bio.slice(0, 30) + "）" + getAwarenessContext(human) + "\n\n严格按此顺序生成4条：\n1. " + cat.name + "\n2. " + human.name + "\n3. " + cat.name + "\n4. " + human.name }
          ]
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var raw = d.choices && d.choices[0] ? d.choices[0].message.content : "[]";
        var ex;
        try {
          var cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          ex = JSON.parse(cleaned);
          if (!Array.isArray(ex) || ex.length < 4) throw new Error("bad");
          // Enforce correct speaker names in case model drifts
          ex[0].speaker = cat.name; ex[2].speaker = cat.name;
          ex[1].speaker = human.name; ex[3].speaker = human.name;
        } catch(e) {
          ex = [
            { speaker: cat.name, text: "\u55b5\uff1f" },
            { speaker: human.name, text: "\u54c7\uff0c\u662f\u56e2\u5b50\uff01" },
            { speaker: cat.name, text: "*\u7f13\u6162\u7728\u773c*" },
            { speaker: human.name, text: "*\u8f7b\u8f7b\u6478\u4e86\u6478\u5934*" },
          ];
        }
        setLatestEx({ exchanges: ex, a1: a1, a2: a2 });
        setConversations(function(prev) {
          return [{ id: Date.now(), agent1: a1, agent2: a2, exchanges: ex, affinity: 99, spark: pick(catSparks) }].concat(prev);
        });
        setGenerating(false);
        setTimeout(function() {
          a1._frozen = false;
          a2._frozen = false;
          convR.current = false;
          setTalkingPair(null);
          setLatestEx(null);
        }, 3500);
      })
      .catch(function() {
        setGenerating(false);
        a1._frozen = false;
        a2._frozen = false;
        convR.current = false;
        setTalkingPair(null);
      });
      return;
    }

    var player = a1.isUser ? a1 : a2;
    var npc = a1.isUser ? a2 : a1;
    var dynamics = generateDynamics(a1, a2);
    a1.lastTalk = performance.now();
    a2.lastTalk = performance.now();

    var APPROACH_MODES = [
      "\u4ee5\u597d\u5947\u63d0\u95ee\u7684\u65b9\u5f0f\u5f00\u573a",
      "\u4ee5\u8f7b\u677e\u8c03\u4fb5\u7684\u8bed\u6c14\u5207\u5165",
      "\u76f4\u63a5\u5206\u4eab\u81ea\u5df1\u6b63\u5728\u60f3\u7684\u4e8b",
      "\u5e26\u7740\u4e00\u70b9\u54f2\u5b66\u8272\u5f69\u5f00\u573a",
      "\u5fc3\u4e0d\u5728\u7109\u968f\u53e3\u4e00\u8bf4",
      "\u70ed\u60c5\u6d0b\u6ea2\u5730\u4e3b\u52a8\u6500\u8c08"
    ];
    var mode = APPROACH_MODES[Math.floor(Math.random() * APPROACH_MODES.length)];
    var metNpcs = agR.current.filter(function(a) { return !a.isUser && !a.isCat && a._metPlayer; });
    var socialCtx = metNpcs.length > 0 ? "\n\n\uff08" + player.name + "\u5df2\u548c" + metNpcs.map(function(a) { return a.name; }).join("\u3001") + "\u804a\u8fc7\uff0c\u53ef\u81ea\u7136\u5730\u63d0\u53ca\uff09" : "";
    var fullPrompt = dynamics.prompt + "\n\n\u5f00\u573a\u65b9\u5f0f\uff1a" + mode + socialCtx;

    setActiveConv({ player: player, npc: npc, exchanges: [], inputPhase: "loading", turnIndex: 1, dynamicsPrompt: fullPrompt });

    fetchNpcLine(npc, player, [], fullPrompt, function(result) {
      var ex1 = [{ speaker: npc.name, text: result.line }];
      setLatestEx({ exchanges: ex1, a1: a1, a2: a2 });
      setActiveConv({ player: player, npc: npc, exchanges: ex1, inputPhase: "user", turnIndex: 1, dynamicsPrompt: fullPrompt, suggestions: { warm: result.warm, cold: result.cold, wild: result.wild }, liveVibe: result.vibe || null });
      setGenerating(false);
    });
  }

  function doNpcPost(poster, other) {
    poster._frozen = true;
    other._frozen = true;
    poster.lastTalk = performance.now();
    other.lastTalk = performance.now();
    // Brief pause only — NPCs resume walking regardless of API response
    setTimeout(function() { poster._frozen = false; other._frozen = false; }, 2500);

    var picked = pickPostMode(poster);
    var awareness = getAwarenessContext(poster);
    var personaBlock = poster.name + "（" + poster.mbti + "，" + poster.zodiac + "）\n简介：" + poster.bio + "\n兴趣：" + poster.interests.join("、");

    var systemContent, userContent;
    if (picked.mode === "gossip") {
      systemContent = "你在扮演一个广场居民，在社交网络上发帖。本次发帖以你认识的另一位居民为主角——可以是亲切吐槽、点评、好奇、反差吐槽、记录有趣观察，但不要恶意。语气完全贴合角色性格，口语化，不要开头说「我」，不要用「作为XX」句式。可以直接喊出对方名字。输出纯JSON：{\"post\":\"内容（25-45字）\"}";
      userContent = personaBlock + awareness + "\n\n本次发帖的主角是 " + picked.target.name + "（你和TA碰过" + picked.rec.count + "次）。以" + poster.name + "的口吻，发一条围绕" + picked.target.name + "的动态。";
    } else {
      systemContent = "你在扮演一个广场居民，在社交网络上发帖。本次发帖风格：" + picked.mode + "。语气完全贴合角色性格，口语化，不要开头说「我」，不要用「作为XX」句式。如果「最近的社交背景」里有相关的人或动态，自然地织进帖子里更好。输出纯JSON：{\"post\":\"内容（25-45字）\"}";
      userContent = personaBlock + awareness + "\n\n刚在广场碰到了" + other.name + "。以" + poster.name + "的口吻，按上述风格发一条动态。";
    }

    fetch("/api/npc-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        temperature: 1.3,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent }
        ]
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var raw = d.choices && d.choices[0] ? d.choices[0].message.content : "";
      var content;
      try {
        var cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        content = JSON.parse(cleaned).post;
      } catch(e) { content = null; }
      if (!content) content = "今天广场上遇到了有趣的人。";
      var post = { id: Date.now(), author: poster, content: content, reactions: [] };
      poster._lastPost = { content: content, ts: Date.now() };
      logEncounter(poster, other);
      setBulletin(function(prev) { return [post].concat(prev); });
      // Schedule 1–2 reactions from random other NPCs
      var pool = agR.current.filter(function(a) { return !a.isUser && !a.isCat && a.id !== poster.id && a.id !== other.id; });
      pool.sort(function() { return Math.random() - 0.5; }).slice(0, 1 + Math.floor(Math.random() * 2)).forEach(function(reactor, idx) {
        setTimeout(function() { doNpcReact(reactor, post.id); }, 12000 + idx * 8000 + Math.random() * 4000);
      });
    })
    .catch(function() {});
  }

  function doNpcReact(reactor, postId) {
    setBulletin(function(prev) {
      var post = prev.find(function(p) { return p.id === postId; });
      if (!post) return prev;
      fetch("/api/npc-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          temperature: 1.2,
          messages: [
            { role: "system", content: "你在扮演一个广场居民，对社交网络上的帖子发表评论（10-20字）。评论风格要多样：可以赞同、反驳、开玩笑、追问、扯到自己的兴趣上、或完全跑题。如果「你认识的人」里提到了发帖人或被提及的人，可以带一点熟人之间的语气。语气贴合角色性格，不要总是附和。输出纯JSON：{\"reaction\":\"内容\"}" },
            { role: "user", content: reactor.name + "（" + reactor.mbti + "，" + reactor.zodiac + "，兴趣：" + reactor.interests.join("、") + "）" + getAwarenessContext(reactor) + "\n\n" + post.author.name + "发帖：「" + post.content + "」\n以" + reactor.name + "的口吻评论。" }
          ]
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var raw = d.choices && d.choices[0] ? d.choices[0].message.content : "";
        var text;
        try {
          var cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          text = JSON.parse(cleaned).reaction;
        } catch(e) { text = null; }
        if (!text) text = "有意思！";
        logEncounter(reactor, post.author);
        setBulletin(function(prev2) {
          return prev2.map(function(p) {
            if (p.id !== postId) return p;
            return Object.assign({}, p, { reactions: p.reactions.concat([{ npc: reactor, text: text }]) });
          });
        });
      })
      .catch(function() {});
      return prev; // state unchanged until fetch resolves
    });
  }

  var userC = Object.entries(affinities)
    .map(function(entry) {
      var parts = entry[0].split("-").map(Number);
      return { a1: personas[parts[0]], a2: personas[parts[1]], score: entry[1] };
    })
    .filter(function(c) { return c.a1 && c.a2 && (c.a1.isUser || c.a2.isUser); })
    .sort(function(a, b) { return b.score - a.score; });

  if (phase === "intro") {
    return (
      <div style={{ fontFamily: "'Noto Sans SC'", background: C.bg, color: C.text }}>
        <link href={FONT} rel="stylesheet" />
        <IntroScreen onStart={startSim} />
        <style>{"*{box-sizing:border-box;margin:0;padding:0}option{background:" + C.surface + ";color:" + C.text + "}"}</style>
      </div>
    );
  }

  if (phase === "end") {
    return (
      <div style={{ fontFamily: "'Noto Sans SC'", background: C.bg, color: C.text }}>
        <link href={FONT} rel="stylesheet" />
        <EndScreen conversations={conversations} mochiPets={mochiPets} personas={personas} onRestart={restart} />
        <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}*{box-sizing:border-box;margin:0;padding:0}"}</style>
      </div>
    );
  }

  var prog = Math.min(cntR.current, MAX_ENC);

  var convPanelJSX = activeConv ? (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ padding: "7px 12px", borderBottom: "1px solid " + C.border + "33", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar persona={activeConv.npc} size={28} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: EL[activeConv.npc.element].color }}>{activeConv.npc.name}</div>
          <div style={{ fontSize: 9, color: C.textMuted }}>{activeConv.npc.mbti + "\u00b7" + activeConv.npc.zodiac}</div>
        </div>
        {activeConv.liveVibe && !generating && (
          <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
            {[1,2,3,4,5].map(function(i) {
              var filled = i <= activeConv.liveVibe;
              var col = activeConv.liveVibe >= 4 ? C.goldBright : activeConv.liveVibe >= 2 ? C.accent : C.textMuted;
              return <span key={i} style={{ fontSize: 9, color: filled ? col : C.border + "88" }}>{"\u2665"}</span>;
            })}
          </div>
        )}
        {generating && <span style={{ fontSize: 10, color: C.gold, animation: "pulse 1.5s infinite" }}>{"\u2726 \u601d\u8003\u4e2d..."}</span>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {activeConv.exchanges.map(function(ex, i) {
          var isNpc = ex.speaker === activeConv.npc.name;
          var elColor = isNpc ? EL[activeConv.npc.element].color : EL[activeConv.player.element].color;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isNpc ? "flex-start" : "flex-end" }}>
              <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 1 }}>{ex.speaker}</div>
              <div style={{ maxWidth: "85%", padding: "6px 10px", background: isNpc ? C.surface : elColor + "22", border: "1px solid " + (isNpc ? C.border + "55" : elColor + "55"), fontSize: 12, color: C.text, lineHeight: 1.6, fontFamily: "'Noto Sans SC'" }}>{ex.text}</div>
            </div>
          );
        })}
        {activeConv.inputPhase === "loading" && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ padding: "6px 12px", background: C.surface, border: "1px solid " + C.border + "55", fontSize: 16, color: C.textMuted, letterSpacing: 4, animation: "pulse 1.2s infinite" }}>{"···"}</div>
          </div>
        )}
      </div>
      {activeConv.inputPhase === "user" && (
        <div style={{ padding: "8px 12px", borderTop: "1px solid " + C.border + "33", flexShrink: 0, paddingBottom: (isMobile && !isPortrait) ? "max(8px, env(safe-area-inset-bottom))" : "8px" }}>
          <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 4 }}>
            {"\u4f60\u7684\u56de\u5e94 (" + (activeConv.turnIndex === 1 ? "1" : "2") + "/2)"}
          </div>
          {activeConv.suggestions && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
              <button
                onClick={function() { submitUserLine(activeConv.suggestions.warm); }}
                style={{ textAlign: "left", padding: "7px 10px", minHeight: 36, fontSize: 11, fontFamily: "'Noto Sans SC'", background: C.goldDim + "18", color: C.goldBright, border: "1px solid " + C.goldDim + "55", cursor: "pointer", lineHeight: 1.4 }}
              >
                <span style={{ fontSize: 9, opacity: 0.7, marginRight: 5 }}>{"\u2600 \u6e29\u6696"}</span>
                {activeConv.suggestions.warm}
              </button>
              {/* cold option hidden — code kept for potential re-enable
              <button
                onClick={function() { submitUserLine(activeConv.suggestions.cold); }}
                style={{ textAlign: "left", padding: "7px 10px", minHeight: 36, fontSize: 11, fontFamily: "'Noto Sans SC'", background: C.surface, color: C.textDim, border: "1px solid " + C.border + "88", cursor: "pointer", lineHeight: 1.4 }}
              >
                <span style={{ fontSize: 9, opacity: 0.7, marginRight: 5 }}>{"\u2745 \u51b7\u6de1"}</span>
                {activeConv.suggestions.cold}
              </button>
              */}
              {activeConv.suggestions.wild && (
                <button
                  onClick={function() { submitUserLine(activeConv.suggestions.wild); }}
                  style={{ textAlign: "left", padding: "7px 10px", minHeight: 36, fontSize: 11, fontFamily: "'Noto Sans SC'", background: C.accent + "12", color: C.accent, border: "1px solid " + C.accent + "44", cursor: "pointer", lineHeight: 1.4 }}
                >
                  <span style={{ fontSize: 9, opacity: 0.7, marginRight: 5 }}>{"\u26a1 \u51fa\u5947"}</span>
                  {activeConv.suggestions.wild}
                </button>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, width: "100%" }}>
            <input
              autoFocus
              value={userInput}
              onChange={function(e) { setUserInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter" && userInput.trim()) submitUserLine(userInput); }}
              placeholder={"\u8bf4\u70b9\u4ec0\u4e48\u2026"}
              maxLength={60}
              style={{ flex: 1, minWidth: 0, padding: "8px 10px", fontSize: 15, fontFamily: "'Noto Sans SC'", background: C.surface, color: C.text, border: "1px solid " + C.border, outline: "none" }}
            />
            <button
              onClick={function() { if (userInput.trim()) submitUserLine(userInput); }}
              style={{ flexShrink: 0, padding: "8px 12px", minHeight: 38, fontSize: 13, fontFamily: "'Noto Serif SC'", background: userInput.trim() ? C.gold : C.surface, color: userInput.trim() ? C.bg : C.textMuted, border: "1px solid " + C.border, cursor: userInput.trim() ? "pointer" : "default", transition: "all 0.2s" }}
            >{"\u53d1\u9001"}</button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  var logPanelJSX = (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border + "33", flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>{"\u25c8 \u4f60\u7684\u7f18\u5206\u56fe\u8c31"}</div>
        {userC.length === 0 ? (
          <div style={{ fontSize: 11, color: C.textMuted }}>{(personas[0] ? personas[0].name : "") + "\u6b63\u5728\u5c0f\u9547\u6f2b\u6b65..."}</div>
        ) : userC.map(function(c, i) {
          var other = c.a1.isUser ? c.a2 : c.a1;
          var el = EL[other.element];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: i < userC.length - 1 ? "1px solid " + C.border + "22" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Avatar persona={other} size={22} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: el.color }}>{el.icon + " " + other.name}</div>
                  <div style={{ fontSize: 8, color: C.textDim }}>{other.mbti + "\u00b7" + other.zodiac + "\u00b7" + other.gender}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.score > 70 ? C.goldBright : c.score > 40 ? C.gold : C.textDim }}>{c.score}</div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "6px 14px 3px", fontSize: 9, fontWeight: 600, color: C.textMuted, letterSpacing: 2, position: "sticky", top: 0, background: C.bg, zIndex: 1 }}>{"邂逅纪录"}</div>
        {conversations.length === 0 ? (
          <div style={{ padding: 14, fontSize: 11, fontFamily: "'Noto Serif SC'", color: C.textMuted, fontStyle: "italic" }}>{"风中传来了低语..."}</div>
        ) : conversations.map(function(conv, i) {
          return <ConvCard key={conv.id} conv={conv} isLatest={i === 0} />;
        })}
      </div>
    </div>
  );

  function timeAgo(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return s + "\u79d2\u524d";
    var m = Math.floor(s / 60);
    if (m < 60) return m + "\u5206\u949f\u524d";
    return Math.floor(m / 60) + "\u5c0f\u65f6\u524d";
  }

  var bulletinPanelJSX = (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid " + C.border + "33", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: 2 }}>{"\u25c8 \u5e7f\u573a\u516c\u544a\u680f"}</span>
        {bulletin.length > 0 && <span style={{ fontSize: 9, color: C.textMuted }}>{bulletin.length + " \u6761\u52a8\u6001"}</span>}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {bulletin.length === 0 ? (
          <div style={{ padding: "24px 14px", fontSize: 11, fontFamily: "'Noto Serif SC'", color: C.textMuted, fontStyle: "italic", textAlign: "center" }}>{"\u5c45\u6c11\u4eec\u8fd8\u6ca1\u53d1\u8fc7\u4efb\u4f55\u52a8\u6001..."}</div>
        ) : bulletin.map(function(post) {
          var el = EL[post.author.element];
          return (
            <div key={post.id} style={{ margin: "8px 10px", background: C.surface, border: "1px solid " + C.border + "44", borderRadius: 2 }}>
              {/* Post header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px 0" }}>
                <Avatar persona={post.author} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: el.color }}>{post.author.name}</span>
                    <span style={{ fontSize: 9, color: C.textMuted }}>{post.author.role}</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>{timeAgo(post.id)}</div>
                </div>
                <span style={{ fontSize: 9, color: el.color + "99", flexShrink: 0 }}>{el.icon}</span>
              </div>
              {/* Post content */}
              <div style={{ padding: "7px 12px 9px", fontSize: 13, color: C.text, lineHeight: 1.75, fontFamily: "'Noto Sans SC'" }}>{post.content}</div>
              {/* Reactions */}
              {post.reactions.length > 0 && (
                <div style={{ borderTop: "1px solid " + C.border + "33", padding: "7px 12px 9px", display: "flex", flexDirection: "column", gap: 5, background: C.bg + "88" }}>
                  <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2 }}>{"\u{1F4AC} " + post.reactions.length + " \u6761\u8bc4\u8bba"}</div>
                  {post.reactions.map(function(r, ri) {
                    var rel = EL[r.npc.element];
                    return (
                      <div key={ri} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <Avatar persona={r.npc} size={18} />
                        <div style={{ flex: 1, background: C.surface, border: "1px solid " + C.border + "33", padding: "4px 8px", borderRadius: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: rel.color, marginRight: 5 }}>{r.npc.name}</span>
                          <span style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{r.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  var tabBarJSX = (
    <div style={{ display: "flex", flexShrink: 0, borderBottom: "1px solid " + C.border + "44" }}>
      <button
        onClick={function() { if (activeConv) setPanelTab("conv"); }}
        style={{ flex: 1, padding: "8px 0", fontSize: 11, fontFamily: "'Noto Sans SC'", background: panelTab === "conv" ? C.surfaceHover : "transparent", color: panelTab === "conv" ? C.gold : activeConv ? C.textDim : C.textMuted, border: "none", borderBottom: "2px solid " + (panelTab === "conv" ? C.gold : "transparent"), cursor: activeConv ? "pointer" : "default", transition: "color 0.15s, border-color 0.15s" }}
      >{"\u5bf9\u8bdd"}</button>
      <button
        onClick={function() { setPanelTab("log"); }}
        style={{ flex: 1, padding: "8px 0", fontSize: 11, fontFamily: "'Noto Sans SC'", background: panelTab === "log" ? C.surfaceHover : "transparent", color: panelTab === "log" ? C.gold : C.textDim, border: "none", borderBottom: "2px solid " + (panelTab === "log" ? C.gold : "transparent"), cursor: "pointer", transition: "color 0.15s, border-color 0.15s" }}
      >{"\u8bb0\u5f55"}</button>
      <button
        onClick={function() { setPanelTab("bulletin"); }}
        style={{ flex: 1, padding: "8px 0", fontSize: 11, fontFamily: "'Noto Sans SC'", background: panelTab === "bulletin" ? C.surfaceHover : "transparent", color: panelTab === "bulletin" ? C.accent : C.textDim, border: "none", borderBottom: "2px solid " + (panelTab === "bulletin" ? C.accent : "transparent"), cursor: "pointer", transition: "color 0.15s, border-color 0.15s", position: "relative" }}
      >
        {"\u516c\u544a\u680f"}
        {bulletin.length > 0 && panelTab !== "bulletin" && <span style={{ position: "absolute", top: 5, right: "18%", width: 5, height: 5, borderRadius: "50%", background: C.accent }}/>}
      </button>
    </div>
  );

  return (
    <div className="av-root" style={{ fontFamily: "'Noto Sans SC'", background: C.bg, color: C.text, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <link href={FONT} rel="stylesheet" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "6px max(12px, env(safe-area-inset-right)) 6px max(12px, env(safe-area-inset-left))" : "7px 20px", borderBottom: "1px solid " + C.goldDim + "44", flexShrink: 0, background: C.bg + "ee", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          <span style={{ fontSize: isMobile ? 14 : 16, fontFamily: "'Cinzel'", fontWeight: 700, color: C.gold }}>AgentVerse</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: isMobile ? 70 : 90, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: (prog / MAX_ENC * 100) + "%", height: "100%", background: "linear-gradient(90deg," + C.goldDim + "," + C.goldBright + ")", borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
            <span style={{ fontSize: 10, color: C.textMuted }}>{prog + "/" + MAX_ENC}</span>
          </div>
          {generating && <span style={{ fontSize: 10, color: C.gold, animation: "pulse 1.5s infinite" }}>{"\u2726 \u4ea4\u8c08\u4e2d..."}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {mochiPets > 0 && <span style={{ fontSize: 10, color: "#f4c874" }}>{"\ud83d\udc31\u00d7" + mochiPets}</span>}
          {!isMobile && <span style={{ fontSize: 11, fontFamily: "'Noto Serif SC'", color: C.textMuted }}>{"\u8499\u5fb7\u5c0f\u9547"}</span>}
        </div>
      </div>

      {/* Content row */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: isMobile && isPortrait ? "column" : "row" }}>

        {/* Map */}
        <div style={{ flex: isMobile && isPortrait ? "0 0 40%" : 1, position: "relative", background: "#b8a888", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
            <TownMap />
            <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}>
              {Object.entries(affinities).map(function(entry) {
                var parts = entry[0].split("-").map(Number);
                var score = entry[1];
                var ag1 = agents.find(function(a) { return a.id === parts[0]; });
                var ag2 = agents.find(function(a) { return a.id === parts[1]; });
                if (!ag1 || !ag2) return null;
                var talking = talkingPair && talkingPair.indexOf(parts[0]) >= 0 && talkingPair.indexOf(parts[1]) >= 0;
                return (
                  <line key={entry[0]} x1={ag1.x + "%"} y1={ag1.y + "%"} x2={ag2.x + "%"} y2={ag2.y + "%"} stroke={score > 70 ? C.gold : score > 40 ? "#8a8a6a" : C.textMuted} strokeWidth={talking ? 2.5 : 1} strokeOpacity={talking ? 0.8 : 0.15} strokeDasharray={talking ? "none" : "4 6"} />
                );
              })}
            </svg>

            {agents.map(function(a) {
              var isTalking = talkingPair && talkingPair.indexOf(a.id) >= 0;
              var lastE = null;
              if (latestEx && isTalking) {
                var filtered = latestEx.exchanges.filter(function(e) { return e.speaker === a.name; });
                lastE = filtered.length > 0 ? filtered[filtered.length - 1] : null;
              }
              var el = EL[a.element];
              return (
                <div key={a.id} style={{ position: "absolute", left: a.x + "%", top: a.y + "%", transform: "translate(-50%,-50%)", transition: "left 0.15s ease-out, top 0.15s ease-out", zIndex: isTalking ? 10 : 3 }}>
                  {isTalking && lastE && <Bubble text={lastE} color={el.color} />}
                  <Avatar persona={a} size={a.isCat ? (isMobile ? 20 : 30) : (isMobile ? 40 : 60)} glow={isTalking} />
                  <div style={{ textAlign: "center", marginTop: 0 }}>
                    <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 600, color: a.isUser ? el.color : a.isCat ? "#f4c874" : "#ffffffdd", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.5)" }}>
                      {a.name + (a.isUser ? " \u2605" : "") + (a.isCat ? " \ud83d\udc31" : "")}
                    </div>
                    {!a.isCat && !isMobile && (
                      <div style={{ fontSize: 7, color: "#ffffffaa", textShadow: "0 1px 2px rgba(0,0,0,0.9)", whiteSpace: "nowrap" }}>
                        {a.mbti + "\u00b7" + a.zodiac}
                      </div>
                    )}
                  </div>
                  {isTalking && (
                    <div style={{ position: "absolute", top: -2, left: "50%", transform: "translateX(-50%)", width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: "50%", border: "1.5px solid " + el.color + "44", animation: "ripple 2s infinite" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile landscape: backdrop to close log drawer */}
          {isMobile && !isPortrait && showLog && !activeConv && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 39 }} onClick={function() { setShowLog(false); }} />
          )}

          {/* Mobile landscape: log drawer */}
          {isMobile && !isPortrait && showLog && !activeConv && (
            <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(280px, 85vw)", background: C.bg + "f8", borderLeft: "1px solid " + C.goldDim + "44", zIndex: 40, display: "flex", flexDirection: "column", overflow: "hidden", paddingRight: "env(safe-area-inset-right)" }}>
              {logPanelJSX}
            </div>
          )}

          {/* Mobile landscape: conversation bottom sheet */}
          {isMobile && !isPortrait && activeConv && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", background: C.bg, borderTop: "2px solid " + C.goldDim + "55", zIndex: 50, display: "flex", flexDirection: "column", animation: "slideUp 0.25s ease-out", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)", paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px", flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} />
              </div>
              {convPanelJSX}
            </div>
          )}
        </div>

        {/* Mobile portrait: bottom panel (map + panel stacked) */}
        {isMobile && isPortrait && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg, borderTop: "2px solid " + C.goldDim + "44", paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
            {tabBarJSX}
            {panelTab === "conv" && activeConv ? convPanelJSX : panelTab === "bulletin" ? bulletinPanelJSX : logPanelJSX}
          </div>
        )}

        {/* Desktop / tablet sidebar */}
        {!isMobile && (
          <div style={{ width: sideW, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid " + C.goldDim + "44", overflow: "hidden", background: C.bg + "f8" }}>
            {tabBarJSX}
            {panelTab === "conv" && activeConv ? convPanelJSX : panelTab === "bulletin" ? bulletinPanelJSX : logPanelJSX}
          </div>
        )}
      </div>

      {/* Mobile landscape tab bar */}
      {isMobile && !isPortrait && !activeConv && (
        <div style={{ display: "flex", flexShrink: 0, borderTop: "1px solid " + C.border + "44", background: C.bg, paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
          <button onClick={function() { setShowLog(false); }} style={{ flex: 1, height: 48, background: !showLog ? C.surfaceHover : "transparent", color: !showLog ? C.gold : C.textMuted, border: "none", borderTop: "2px solid " + (!showLog ? C.gold : "transparent"), fontSize: 12, fontFamily: "'Noto Sans SC'", cursor: "pointer" }}>{"\ud83d\uddfa \u5730\u56fe"}</button>
          <button onClick={function() { setShowLog(function(v) { return !v; }); }} style={{ flex: 1, height: 48, background: showLog ? C.surfaceHover : "transparent", color: showLog ? C.gold : C.textMuted, border: "none", borderTop: "2px solid " + (showLog ? C.gold : "transparent"), fontSize: 12, fontFamily: "'Noto Sans SC'", cursor: "pointer" }}>{"\ud83d\udcdc \u65e5\u5fd7"}</button>
        </div>
      )}

      <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes ripple{0%{transform:translateX(-50%) scale(1);opacity:0.4}100%{transform:translateX(-50%) scale(1.6);opacity:0}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}.av-root{height:100vh;height:100dvh;overflow:hidden}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:" + C.goldDim + "44;border-radius:3px}*{box-sizing:border-box;margin:0;padding:0}option{background:" + C.surface + ";color:" + C.text + "}"}</style>
    </div>
  );
}
