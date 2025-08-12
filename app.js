// Chaeeze v2 - keyword-based mood + question detection (offline)
// Conversation persists in localStorage under key "chaeeze_convo".
// Safety: if user mentions self-harm, bot gives crisis-support message and encourages seeking help.

const MOOD_KEYWORDS = {
  sad: ["sad","sadness","depressed","depressing","unhappy","down","lonely","loneliness","tear","cry","crying","hopeless"],
  happy: ["happy","great","joy","excited","excitedly","glad","awesome","yay","good news","celebrate"],
  angry: ["angry","mad","furious","annoyed","frustrated","pissed","hate"],
  tired: ["tired","exhausted","sleepy","drained","burnout"],
  stressed: ["stressed","stress","anxious","anxiety","worried","overwhelmed","panic","nervous"]
};

const SELF_HARM_KEYWORDS = ["suicide","kill myself","end my life","hurt myself","kill myself","die by","want to die","i want to die","i'll kill myself","i will kill myself"];

const QUESTION_WORDS = ["what","how","why","when","should","can","could","help","advice","what should"];

const EMPATHETIC_FALLBACK = [
  "I hear you.",
  "That sounds heavy — I'm listening.",
  "I'm here with you.",
  "It's okay to feel that way.",
  "Take a breath — tell me more when you're ready."
];

const SUGGESTIVE_ANSWERS = [
  "Sometimes a small step helps — can you try one tiny thing right now?",
  "Would it help to name one small, doable task for today?",
  "Talking to someone you trust can help. If that's not possible, I'm here to listen."
];

const chatWindow = document.getElementById('chatWindow');
const inputForm = document.getElementById('inputForm');
const messageInput = document.getElementById('messageInput');

function timeNow(){
  const d = new Date();
  return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function appendMessage(text, who='bot'){
  const div = document.createElement('div');
  div.className = 'msg ' + (who==='me' ? 'me' : 'bot');
  div.innerHTML = '<div class="text"></div><span class="time"></span>';
  div.querySelector('.text').textContent = text;
  div.querySelector('.time').textContent = timeNow();
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function saveMessage(text, who){
  const raw = localStorage.getItem('chaeeze_convo');
  const arr = raw ? JSON.parse(raw) : [];
  arr.push({text, who, t:Date.now()});
  localStorage.setItem('chaeeze_convo', JSON.stringify(arr));
}

function loadConversation(){
  const raw = localStorage.getItem('chaeeze_convo');
  if(!raw) return;
  try{
    const arr = JSON.parse(raw);
    arr.forEach(item => appendMessage(item.text, item.who));
  }catch(e){ console.warn('Could not parse convo', e); }
}

// helpers
function containsAny(text, list){
  const t = text.toLowerCase();
  return list.some(w => t.includes(w));
}

function detectMood(text){
  for(const [m, arr] of Object.entries(MOOD_KEYWORDS)){
    if(containsAny(text, arr)) return m;
  }
  return null;
}

function isQuestion(text){
  const t = text.trim().toLowerCase();
  // question mark or starting with question word
  if(t.endsWith('?')) return true;
  return containsAny(t, QUESTION_WORDS);
}

function detectSelfHarm(text){
  return containsAny(text, SELF_HARM_KEYWORDS);
}

// Bot response logic
function botReply(userText){
  const t = (userText||'').trim();
  if(!t){
    const msg = "It's okay — you can type whenever you're ready.";
    delayedReply(msg);
    return;
  }

  // self-harm detection: urgent, safety-first response
  if(detectSelfHarm(t)){
    const urgent = "I'm really sorry you're feeling this way. If you are thinking about hurting yourself or ending your life, please consider reaching out for immediate help — " +
      "contact local emergency services or a crisis hotline. " +
      "If you're in India, you can call or text 9152987821 (Sneha) or reach out to a local helpline. " +
      "You don't have to go through this alone. If you'd like, tell me if you'd like resources or someone to contact.";
    delayedReply(urgent);
    return;
  }

  // mood detection
  const mood = detectMood(t);
  if(mood === 'sad' || mood === 'lonely'){
    delayedReply("I'm sorry you're feeling this way. I'm here with you — would you like to tell me more about what's on your mind?");
    return;
  }
  if(mood === 'happy'){
    delayedReply("That's wonderful! I'm happy for you — want to share what made your day special?");
    return;
  }
  if(mood === 'angry'){
    delayedReply("I can hear your frustration. It's okay to feel angry — would you like to describe what's making you feel this way?");
    return;
  }
  if(mood === 'tired'){
    delayedReply("That sounds exhausting. You deserve rest — is there something small that might help you relax right now?");
    return;
  }
  if(mood === 'stressed'){
    delayedReply("Stress can be overwhelming. Try taking one small break — maybe a short walk or a few deep breaths. Want to try that now?");
    return;
  }

  // question handling
  if(isQuestion(t)){
    // handle "what should I do" specifically
    if(t.includes("what should i do") || t.includes("what do i do") || t.includes("what should") ){
      delayedReply("Sometimes breaking the situation into tiny steps helps. What is one small thing that would feel doable right now?");
      return;
    }
    // general supportive answer to questions
    delayedReply(SUGGESTIVE_ANSWERS[Math.floor(Math.random()*SUGGESTIVE_ANSWERS.length)]);
    return;
  }

  // fallback: reflective or empathetic
  if(Math.random() < 0.35 && t.split(' ').length > 3){
    // reflective echo of a word
    const words = t.split(' ').filter(w=>w.length>2);
    const pick = words[Math.floor(Math.random()*Math.min(words.length,4))] || 'that';
    delayedReply(`It sounds like ${pick} is important to you. ${EMPATHETIC_FALLBACK[Math.floor(Math.random()*EMPATHETIC_FALLBACK.length)]}`);
    return;
  }

  delayedReply(EMPATHETIC_FALLBACK[Math.floor(Math.random()*EMPATHETIC_FALLBACK.length)]);
}

function delayedReply(msg){
  setTimeout(()=>{
    appendMessage(msg, 'bot');
    saveMessage(msg, 'bot');
  }, 500 + Math.random()*700);
}

// event wiring
inputForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const text = messageInput.value.trim();
  if(!text) return;
  appendMessage(text, 'me');
  saveMessage(text, 'me');
  messageInput.value = '';
  botReply(text);
});

// load previous conversation
loadConversation();
messageInput.focus();
