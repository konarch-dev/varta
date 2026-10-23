const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));
let argon2;
try {
  argon2 = require('argon2');
} catch (e) {
  argon2 = require(path.resolve(__dirname, '../../../node_modules/argon2'));
}

// 60 high-quality Unsplash portrait face photos
const AVATAR_URLS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1514626585111-9aa86183ac98?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1534751516642-a171edd2521d?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1519764622345-23439dd774f7?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1496302662116-35cc4f36df92?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1509783236416-c9ad59bae472?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1539614474468-f423a2d2270c?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
];

// 40 high-quality Unsplash cover/banner photos
const COVER_URLS = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=1200&h=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&auto=format&fit=crop&q=80',
];

const RAW_PROFILES = [
  {
    username: 'aditya_chopra',
    displayName: 'Aditya Chopra 🎬',
    bio: 'Cinema lover, screenwriter & indie filmmaker. Exploring human connections through visual storytelling.',
    location: 'Mumbai, Maharashtra',
    website: 'https://adityachopra.films',
    isVerified: true,
  },
  {
    username: 'sneha_reddy',
    displayName: 'Sneha Reddy 🌿',
    bio: 'Urban farmer, sustainability advocate & zero-waste lifestyle consultant. Greening Indian cities.',
    location: 'Hyderabad, Telangana',
    website: 'https://greenbharat.org',
    isVerified: false,
  },
  {
    username: 'dev_nair',
    displayName: 'Dev Nair ⚡',
    bio: 'Systems Engineer & Rustacean. Building distributed systems, low-latency queues & dev tooling.',
    location: 'Bengaluru, Karnataka',
    website: 'https://devnair.io',
    isVerified: true,
  },
  {
    username: 'ishita_bose',
    displayName: 'Ishita Bose ☕',
    bio: 'Literary critic, essayist & amateur tea blender. Talking Bengali literature, modern poetry & coffee.',
    location: 'Kolkata, West Bengal',
    website: 'https://ishitabose.substack.com',
    isVerified: false,
  },
  {
    username: 'kabir_mehra',
    displayName: 'Kabir Mehra 📈',
    bio: 'Macro investor, chartered financial analyst. Decoding RBI policies, sovereign bonds & equity markets.',
    location: 'New Delhi, India',
    website: 'https://mehraanalytics.in',
    isVerified: true,
  },
  {
    username: 'tanvi_deshmukh',
    displayName: 'Tanvi Deshmukh 🎨',
    bio: 'Digital illustrator & 3D motion designer. Inspired by Warli art and modern cyberpunk visuals.',
    location: 'Pune, Maharashtra',
    website: 'https://behance.net/tanvideshmukh',
    isVerified: false,
  },
  {
    username: 'vikram_aditya',
    displayName: 'Vikramaditya Rao 🏛️',
    bio: 'Heritage conservationist & historical researcher. Unearthing forgotten temples & forts of South India.',
    location: 'Mysuru, Karnataka',
    website: 'https://indiaroute.in',
    isVerified: true,
  },
  {
    username: 'zoya_akhtar_lens',
    displayName: 'Zoya Akhtar 📷',
    bio: 'Street and documentary photographer. Capturing the untold stories of Old Delhi and Banaras ghats.',
    location: 'New Delhi, India',
    website: 'https://zoyalens.com',
    isVerified: false,
  },
  {
    username: 'karan_malhotra',
    displayName: 'Karan Malhotra 🏎️',
    bio: 'Automotive journalist, motorsports enthusiast. Track tests, EV revolutions & Formula 1 debriefs.',
    location: 'Gurugram, Haryana',
    website: 'https://throttleindia.in',
    isVerified: true,
  },
  {
    username: 'pooja_hegde_ux',
    displayName: 'Pooja Hegde ✨',
    bio: 'UX lead building accessibility-first interfaces for India 2 and 3. Design systems nerd.',
    location: 'Bengaluru, Karnataka',
    website: 'https://pooja.design',
    isVerified: false,
  },
  {
    username: 'rohit_verma_ai',
    displayName: 'Rohit Verma 🤖',
    bio: 'Applied ML Researcher. Building Indic language LLMs and multilingual voice agents.',
    location: 'Hyderabad, Telangana',
    website: 'https://rohitai.tech',
    isVerified: true,
  },
  {
    username: 'sakshi_tanwar_law',
    displayName: 'Sakshi Tanwar ⚖️',
    bio: 'Tech policy lawyer, privacy rights activist. Writing on data sovereignty and AI governance.',
    location: 'New Delhi, India',
    website: 'https://privacylawindia.org',
    isVerified: true,
  },
  {
    username: 'manish_pandey_cricket',
    displayName: 'Manish Pandey 🏏',
    bio: 'Domestic cricket scout, analyst and podcaster. Following Ranji, Duleep & youth talent pipelines.',
    location: 'Noida, Uttar Pradesh',
    website: 'https://cricpath.in',
    isVerified: false,
  },
  {
    username: 'ananya_singh_art',
    displayName: 'Ananya Singh 🖌️',
    bio: 'Traditional oil painter & gallery curator. Celebrating Indian miniature and Tanjore art traditions.',
    location: 'Jaipur, Rajasthan',
    website: 'https://ananyaart.in',
    isVerified: false,
  },
  {
    username: 'varun_dhawan_fit',
    displayName: 'Varun Dhawan 🏋️‍♂️',
    bio: 'Calisthenics coach, nutritionist & functional fitness evangelist. Movement is medicine.',
    location: 'Chandigarh, India',
    website: 'https://varunfit.in',
    isVerified: false,
  },
  {
    username: 'meera_krishnan',
    displayName: 'Meera Krishnan 🎵',
    bio: 'Carnatic vocalist & fusion violinist. Exploring jazz-classical crossovers and ragas in contemporary music.',
    location: 'Chennai, Tamil Nadu',
    website: 'https://meeramusic.in',
    isVerified: true,
  },
  {
    username: 'siddharth_joshi',
    displayName: 'Siddharth Joshi ✈️',
    bio: 'Travel storyteller, cultural explorer. Documenting remote villages across the Himalayas and Northeast.',
    location: 'Dehradun, Uttarakhand',
    website: 'https://wanderindiabyjoshi.com',
    isVerified: true,
  },
  {
    username: 'riya_sen_food',
    displayName: 'Riya Sen 🍲',
    bio: 'Culinary researcher, home chef & regional gastronomy chronicler. Preserving forgotten family recipes.',
    location: 'Kolkata, West Bengal',
    website: 'https://bengalikitchen.in',
    isVerified: false,
  },
  {
    username: 'nikhil_kamath_trader',
    displayName: 'Nikhil Kamath 📊',
    bio: 'Options strategist, algorithmic trading enthusiast. Risk management above all.',
    location: 'Ahmedabad, Gujarat',
    website: 'https://algotraderindia.in',
    isVerified: false,
  },
  {
    username: 'kavita_devi_ngo',
    displayName: 'Kavita Devi 🤝',
    bio: 'Grassroots educator & rural women empowerment volunteer. Teaching digital literacy across UP.',
    location: 'Lucknow, Uttar Pradesh',
    website: 'https://sakshamindia.ngo',
    isVerified: true,
  },
  {
    username: 'rahul_subramanian',
    displayName: 'Rahul Subramanian 🎙️',
    bio: 'Standup comic, improv artist. Finding humour in corporate absurdity and daily commuter struggles.',
    location: 'Mumbai, Maharashtra',
    website: 'https://rahulstandup.in',
    isVerified: true,
  },
  {
    username: 'divya_spandana_tech',
    displayName: 'Divya Spandana 💻',
    bio: 'Frontend architect. Obsessed with web performance, zero-runtime CSS and micro-interactions.',
    location: 'Bengaluru, Karnataka',
    website: 'https://divyacodes.dev',
    isVerified: false,
  },
  {
    username: 'akash_gupta_startup',
    displayName: 'Akash Gupta 🚀',
    bio: 'SaaS founder. Went from 0 to $1M ARR in 14 months. Sharing transparent lessons on B2B product growth.',
    location: 'Gurugram, Haryana',
    website: 'https://growthsaas.in',
    isVerified: true,
  },
  {
    username: 'natasha_rastogi',
    displayName: 'Natasha Rastogi 📚',
    bio: 'Book editor, bibliophile. Reviews on South Asian fiction, translation works & independent presses.',
    location: 'New Delhi, India',
    website: 'https://literarydelhi.com',
    isVerified: false,
  },
  {
    username: 'samir_soni_devops',
    displayName: 'Samir Soni ☁️',
    bio: 'Cloud Architect & Kubernetes contributor. Making infrastructure boring and 99.999% reliable.',
    location: 'Pune, Maharashtra',
    website: 'https://samircloud.dev',
    isVerified: false,
  },
  {
    username: 'tanya_khan_astronomy',
    displayName: 'Tanya Khan 🌌',
    bio: 'Astrophysics PhD scholar. Stargazer, space missions commentator & ISRO admirer.',
    location: 'Bengaluru, Karnataka',
    website: 'https://cosmicindia.space',
    isVerified: true,
  },
  {
    username: 'ritesh_deshmukh_green',
    displayName: 'Ritesh Deshmukh 🌳',
    bio: 'Solar tech entrepreneur & renewable energy enthusiast. Powering rural clinics with off-grid microgrids.',
    location: 'Nagpur, Maharashtra',
    website: 'https://suryaenergies.in',
    isVerified: false,
  },
  {
    username: 'pallavi_sharda_yoga',
    displayName: 'Pallavi Sharda 🧘‍♀️',
    bio: 'Ashtanga yoga practitioner, breathwork therapist. Helping engineers fix posture and reduce burnout.',
    location: 'Rishikesh, Uttarakhand',
    website: 'https://pranawellness.in',
    isVerified: false,
  },
  {
    username: 'alok_nath_history',
    displayName: 'Prof. Alok Nath 📜',
    bio: 'Ancient Indian history faculty. Numismatics, epigraphy and trade routes of the Indian Ocean.',
    location: 'Varanasi, Uttar Pradesh',
    website: 'https://indichistory.edu',
    isVerified: true,
  },
  {
    username: 'shreya_ghoshal_tunes',
    displayName: 'Shreya Ghoshal 🎤',
    bio: 'Playback singer & classical exponent. Music is prayer, melody is life.',
    location: 'Mumbai, Maharashtra',
    website: 'https://shreyatunes.in',
    isVerified: true,
  },
  {
    username: 'harsh_beniwal_vlogs',
    displayName: 'Harsh Beniwal 🎬',
    bio: 'Comedy creator & sketch writer. Bringing relatable family chaos to screen.',
    location: 'Delhi, India',
    website: 'https://harshsketches.in',
    isVerified: false,
  },
  {
    username: 'neha_kakkar_pop',
    displayName: 'Neha Kakkar ✨',
    bio: 'Pop singer, entertainer. Bringing rhythm and high energy live shows across the globe.',
    location: 'Mumbai, Maharashtra',
    website: 'https://nehapop.com',
    isVerified: false,
  },
  {
    username: 'ayush_sharma_cyber',
    displayName: 'Ayush Sharma 🛡️',
    bio: 'Ethical hacker, red team lead. Bug bounties, threat intelligence & zero-day research.',
    location: 'Indore, Madhya Pradesh',
    website: 'https://ayushsec.net',
    isVerified: true,
  },
  {
    username: 'prachi_desai_fashion',
    displayName: 'Prachi Desai 👗',
    bio: 'Sustainable fashion designer. Handloom textiles, Khadi revival and ethical runway looks.',
    location: 'Ahmedabad, Gujarat',
    website: 'https://khadicouture.in',
    isVerified: false,
  },
  {
    username: 'mohit_chauhan_hikes',
    displayName: 'Mohit Chauhan 🏔️',
    bio: 'High-altitude mountaineer. Summited 5 peaks above 6000m. Mountain safety instructor.',
    location: 'Manali, Himachal Pradesh',
    website: 'https://himalayanroutes.in',
    isVerified: true,
  },
  {
    username: 'swati_mohan_space',
    displayName: 'Dr. Swati Mohan 🛰️',
    bio: 'Guidance and controls engineer. Aerospace systems, planetary probes & science communication.',
    location: 'Bengaluru, Karnataka',
    website: 'https://aerospaceswati.space',
    isVerified: true,
  },
  {
    username: 'chetan_bhagat_books',
    displayName: 'Chetan Bhagat 📖',
    bio: 'Novelist, motivational speaker & columnist on youth trends, economy and education.',
    location: 'Mumbai, Maharashtra',
    website: 'https://chetanbhagat.in',
    isVerified: true,
  },
  {
    username: 'urvashi_rautela_style',
    displayName: 'Urvashi Rautela 💎',
    bio: 'Fashion icon, pageant winner & fitness enthusiast. Haute couture and international cinema.',
    location: 'Mumbai, Maharashtra',
    website: 'https://urvashiofficial.in',
    isVerified: false,
  },
  {
    username: 'amit_trivedi_beats',
    displayName: 'Amit Trivedi 🎹',
    bio: 'Music composer & sound producer. Blending folk traditions with electronic indie soundscapes.',
    location: 'Mumbai, Maharashtra',
    website: 'https://amittrivediofficial.com',
    isVerified: true,
  },
  {
    username: 'sonali_bendre_reads',
    displayName: 'Sonali Bendre 📖',
    bio: 'Actor, cancer survivor, book club founder. Inspiring wellness, resilience and lifelong learning.',
    location: 'Mumbai, Maharashtra',
    website: 'https://sonalisbookclub.com',
    isVerified: true,
  },
  {
    username: 'gaurav_taneja_fly',
    displayName: 'Capt. Gaurav Taneja ✈️',
    bio: 'Commercial pilot, civil aviation expert, fitness enthusiast & daily vlogger.',
    location: 'New Delhi, India',
    website: 'https://flyingbeast.in',
    isVerified: true,
  },
  {
    username: 'nidhi_sunil_model',
    displayName: 'Nidhi Sunil 🌟',
    bio: 'International supermodel & human rights advocate. Speaking up against colorism in media.',
    location: 'Kochi, Kerala',
    website: 'https://nidhisunil.com',
    isVerified: true,
  },
  {
    username: 'ashish_chanchlani_fun',
    displayName: 'Ashish Chanchlani 🎭',
    bio: 'Content creator & digital entertainer. Making people smile across Bharat every day.',
    location: 'Ulhasnagar, Maharashtra',
    website: 'https://chanchlanifilms.com',
    isVerified: true,
  },
  {
    username: 'disha_patani_action',
    displayName: 'Disha Patani 🥋',
    bio: 'Martial artist, actor & anime fan. Gymnastics, animal rescue & kickboxing routines.',
    location: 'Bareilly / Mumbai',
    website: 'https://dishapatani.in',
    isVerified: false,
  },
  {
    username: 'bhuvan_bam_creations',
    displayName: 'Bhuvan Bam 🎙️',
    bio: 'Writer, actor, musician & producer. Building India’s largest character-driven digital universe.',
    location: 'New Delhi, India',
    website: 'https://bhuvanbam.in',
    isVerified: true,
  },
  {
    username: 'kiara_advani_cinema',
    displayName: 'Kiara Advani ✨',
    bio: 'Film actor & dance enthusiast. Celebrating Indian storytelling and cinema.',
    location: 'Mumbai, Maharashtra',
    website: 'https://kiaraofficial.com',
    isVerified: false,
  },
  {
    username: 'ranveer_allahbadia_mind',
    displayName: 'Ranveer Allahbadia 🎙️',
    bio: 'Podcaster & entrepreneur. Long-form conversations on spirituality, history, geopolitics & science.',
    location: 'Mumbai, Maharashtra',
    website: 'https://beerbiceps.com',
    isVerified: true,
  },
  {
    username: 'kriti_sanon_studio',
    displayName: 'Kriti Sanon 🎬',
    bio: 'Engineer-turned-actor & film producer. Passionate about women-centric scripts and fitness.',
    location: 'New Delhi / Mumbai',
    website: 'https://kritisanofficial.com',
    isVerified: true,
  },
  {
    username: 'carry_minati_gaming',
    displayName: 'Ajey Nagar (CarryMinati) 🎮',
    bio: 'Gamer, satirist, rapper & live streamer. Keeping it 100% authentic.',
    location: 'Faridabad, Haryana',
    website: 'https://carryminati.live',
    isVerified: true,
  },
  {
    username: 'taapsee_pannu_producer',
    displayName: 'Taapsee Pannu 🏸',
    bio: 'Actor, squash player & independent producer. Fearless roles and honest storytelling.',
    location: 'New Delhi / Mumbai',
    website: 'https://outsidersfilms.in',
    isVerified: true,
  },
  {
    username: 'kunal_fintech_geek',
    displayName: 'Kunal FinTech 💡',
    bio: 'Curious student of human behavior, credit systems & consumer tech revolutions.',
    location: 'Bengaluru, Karnataka',
    website: 'https://curiouskunal.com',
    isVerified: true,
  },
  {
    username: 'deepinder_foodie_ops',
    displayName: 'Deepinder Logistics 🛵',
    bio: 'Hyperlocal supply chains, dark stores and instant commerce architectures.',
    location: 'Gurugram, Haryana',
    website: 'https://quickcommerce.tech',
    isVerified: true,
  },
  {
    username: 'sridhar_rural_tech',
    displayName: 'Sridhar Rural Tech 🌾',
    bio: 'Building enterprise software from rural villages. Decentralizing tech wealth and talent.',
    location: 'Tenkasi, Tamil Nadu',
    website: 'https://ruralenterprise.org',
    isVerified: true,
  },
  {
    username: 'falguni_beauty_founder',
    displayName: 'Falguni Nayar 💄',
    bio: 'Retail innovator, e-commerce pioneer. Championing consumer empowerment and beauty commerce.',
    location: 'Mumbai, Maharashtra',
    website: 'https://beautyinindia.com',
    isVerified: true,
  },
  {
    username: 'tarun_ev_mobility',
    displayName: 'Tarun EV Mobility ⚡',
    bio: 'Electric two-wheelers, battery thermal design and clean smart mobility for Bharat.',
    location: 'Bengaluru, Karnataka',
    website: 'https://evbharat.org',
    isVerified: true,
  },
  {
    username: 'suumit_growth_hacker',
    displayName: 'Suumit Shah 📈',
    bio: 'Building mobile-first tools for small businesses. Zero to millions of downloads.',
    location: 'Mumbai, Maharashtra',
    website: 'https://dukaanstartup.in',
    isVerified: false,
  },
  {
    username: 'tanmay_creative_lab',
    displayName: 'Tanmay Creative Lab 🧠',
    bio: 'Advertising, chess, standup and internet culture experiments.',
    location: 'Mumbai, Maharashtra',
    website: 'https://tanmaybhat.com',
    isVerified: true,
  },
  {
    username: 'radhika_angel_invest',
    displayName: 'Radhika Ghai 💼',
    bio: 'Early-stage angel investor & mentor. Backing women founders building the next unicorns.',
    location: 'Gurugram, Haryana',
    website: 'https://kindlestartups.in',
    isVerified: true,
  },
  {
    username: 'bhavish_robotics_ai',
    displayName: 'Bhavish Future Tech 🦾',
    bio: 'Autonomous vehicles, AI compute clusters & next-gen gigafactories.',
    location: 'Bengaluru, Karnataka',
    website: 'https://futuretechindia.in',
    isVerified: false,
  },
  {
    username: 'nithin_zerodha_mind',
    displayName: 'Nithin Kamath 📉',
    bio: 'Bootstrapping profitable ventures, long-term health and climate philanthropy.',
    location: 'Bengaluru, Karnataka',
    website: 'https://rainmatter.org',
    isVerified: true,
  },
  {
    username: 'manoj_tiwary_folk',
    displayName: 'Manoj Tiwary 🪕',
    bio: 'Bhojpuri folk revivalist, harmonium teacher & cultural heritage archivist.',
    location: 'Patna, Bihar',
    website: 'https://folkbihar.org',
    isVerified: false,
  },
  {
    username: 'anupam_mittal_shark',
    displayName: 'Anupam Mittal 🦈',
    bio: 'Angel investor in 200+ startups. Matchmaking, consumer tech and candid startup wisdom.',
    location: 'Mumbai, Maharashtra',
    website: 'https://anupammittal.in',
    isVerified: true,
  },
  {
    username: 'vineeta_singh_sugar',
    displayName: 'Vineeta Singh 🏃‍♀️',
    bio: 'Triathlete, Ironman finisher & D2C cosmetics founder. Unstoppable grit.',
    location: 'Mumbai, Maharashtra',
    website: 'https://gritandglory.in',
    isVerified: true,
  },
  {
    username: 'aman_gupta_boAt',
    displayName: 'Aman Gupta 🎧',
    bio: 'Audio tech founder, hustler, consumer branding geek. Hum bhi bana lenge!',
    location: 'New Delhi, India',
    website: 'https://boatfounders.in',
    isVerified: true,
  },
  {
    username: 'peyush_bansal_vision',
    displayName: 'Peyush Bansal 👓',
    bio: 'Making vision accessible for 1 billion people. Supply chain excellence and robotics.',
    location: 'New Delhi, India',
    website: 'https://visionforindia.org',
    isVerified: true,
  },
  {
    username: 'namita_thapar_pharma',
    displayName: 'Namita Thapar 💊',
    bio: 'Healthcare leader, women’s wellness crusader and author. Authentic conversations on healthcare.',
    location: 'Pune, Maharashtra',
    website: 'https://thaparwellness.in',
    isVerified: true,
  },
  {
    username: 'gazal_alagh_mama',
    displayName: 'Ghazal Alagh 🌿',
    bio: 'Toxin-free living advocate & clean beauty innovator. Motherhood, leadership & focus.',
    location: 'Gurugram, Haryana',
    website: 'https://cleanghazal.in',
    isVerified: true,
  },
  {
    username: 'sanjeev_bikhi_info',
    displayName: 'Sanjeev Bikhchandani 🌐',
    bio: 'The pioneer of Indian consumer internet. Investing in the future of Bharat.',
    location: 'Noida, Uttar Pradesh',
    website: 'https://internetindia.org',
    isVerified: true,
  },
  {
    username: 'vijay_shekhar_pay',
    displayName: 'Vijay Shekhar Sharma 📱',
    bio: 'QR codes for all, digital payments inclusion & financial sovereignty for India.',
    location: 'Noida, Uttar Pradesh',
    website: 'https://vssdigital.in',
    isVerified: true,
  },
  {
    username: 'harsha_bhogle_voice',
    displayName: 'Harsha Bhogle 🎙️',
    bio: 'The voice of cricket. Words that paint pictures of 22 yards for over 30 years.',
    location: 'Mumbai, Maharashtra',
    website: 'https://harshabhogle.com',
    isVerified: true,
  },
  {
    username: 'vikas_khanna_chef',
    displayName: 'Chef Vikas Khanna 👨‍🍳',
    bio: 'Michelin star chef, filmmaker, philanthropist. Celebrating the sacred flavors of India.',
    location: 'Amritsar / New York',
    website: 'https://vkhanna.com',
    isVerified: true,
  },
  {
    username: 'ranveer_brar_recipes',
    displayName: 'Chef Ranveer Brar 🍲',
    bio: 'Food is a language, cooking is an art. Discovering heritage recipes on the streets of Lucknow.',
    location: 'Lucknow / Mumbai',
    website: 'https://ranveerbrar.com',
    isVerified: true,
  },
  {
    username: 'masaba_gupta_house',
    displayName: 'Masaba Gupta 🐆',
    bio: 'Fashion designer, actor. Bold motifs, unconventional prints and unapologetic individuality.',
    location: 'Mumbai, Maharashtra',
    website: 'https://houseofmasaba.com',
    isVerified: true,
  },
  {
    username: 'karan_johar_cinema',
    displayName: 'Karan Johar 🎬',
    bio: 'Director, producer, storyteller. Celebrating family sagas, grand romances and Bollywood grandeur.',
    location: 'Mumbai, Maharashtra',
    website: 'https://dharmafilms.com',
    isVerified: false,
  },
  {
    username: 'anurag_kashyap_dark',
    displayName: 'Anurag Kashyap 🎥',
    bio: 'Gritty indie cinema, noir thrillers, candid cinephilia. Art over commerce, always.',
    location: 'Mumbai, Maharashtra',
    website: 'https://kashyapfilms.in',
    isVerified: true,
  },
  {
    username: 'ss_rajamouli_vision',
    displayName: 'S.S. Rajamouli 🏹',
    bio: 'Visual world builder, director. Bringing Indian mythology and larger-than-life epics to global cinema.',
    location: 'Hyderabad, Telangana',
    website: 'https://rajamoulifilms.com',
    isVerified: true,
  },
  {
    username: 'prashanth_neel_action',
    displayName: 'Prashanth Neel ⚡',
    bio: 'Director. High-octane action, brooding cinematography and epic character scale.',
    location: 'Bengaluru, Karnataka',
    website: 'https://neelfilms.in',
    isVerified: false,
  },
  {
    username: 'maniratnam_visuals',
    displayName: 'Mani Ratnam 🎞️',
    bio: 'Cinematic maestro. Exploring human relationships against the backdrop of history and politics.',
    location: 'Chennai, Tamil Nadu',
    website: 'https://madrasfilmtalkies.com',
    isVerified: true,
  },
  {
    username: 'ar_rahman_symphony',
    displayName: 'A.R. Rahman 🎵',
    bio: 'Oscar & Grammy winning composer. Uniting hearts through the universal divine frequency of music.',
    location: 'Chennai, Tamil Nadu',
    website: 'https://arrahman.com',
    isVerified: true,
  },
  {
    username: 'shankar_ehsaan_loy',
    displayName: 'Shankar Mahadevan 🎶',
    bio: 'Singer and composer. From Breathless to semi-classical ragas, music is eternal breath.',
    location: 'Mumbai, Maharashtra',
    website: 'https://shankarmahadevan.com',
    isVerified: true,
  },
  {
    username: 'prateek_kuhad_acoustic',
    displayName: 'Prateek Kuhad 🎸',
    bio: 'Indie singer-songwriter. Melancholic ballads, acoustic guitars and honest poetry.',
    location: 'Jaipur / New Delhi',
    website: 'https://prateekkuhad.com',
    isVerified: true,
  },
  {
    username: 'anuv_jain_lyrics',
    displayName: 'Anuv Jain 🌧️',
    bio: 'Baritone melodies, storytelling lyrics and monsoon nostalgia. Just a boy with a guitar.',
    location: 'Ludhiana, Punjab',
    website: 'https://anuvjainmusic.com',
    isVerified: true,
  },
  {
    username: 'zaeden_electronic',
    displayName: 'Zaeden (Sahil Sharma) 🎧',
    bio: 'Electronic dance music producer turned pop-singer. Bringing melodic vibes from clubs to arenas.',
    location: 'Gurugram, Haryana',
    website: 'https://zaedenmusic.in',
    isVerified: false,
  },
  {
    username: 'ritviz_dance_beats',
    displayName: 'Ritviz 🪩',
    bio: 'Indian classical-infused EDM beats. Udd Gaye and dancing through everyday memories.',
    location: 'Pune, Maharashtra',
    website: 'https://ritviz.in',
    isVerified: true,
  },
  {
    username: 'divine_gully_gang',
    displayName: 'DIVINE (Gully Gang) 🎤',
    bio: 'Pioneer of Mumbai street hip-hop. Real stories from the 59 to the global stage.',
    location: 'Mumbai, Maharashtra',
    website: 'https://gullygang.in',
    isVerified: true,
  },
  {
    username: 'seedhe_maut_delhi',
    displayName: 'Seedhe Maut 🔥',
    bio: 'Encore ABJ x Calm. Unapologetic lyrical dexterity from the capital city.',
    location: 'New Delhi, India',
    website: 'https://seedhemaut.in',
    isVerified: true,
  },
  {
    username: 'krishna_kaul_krsna',
    displayName: 'KR$NA 👑',
    bio: 'Technical rap, multi-syllabic rhyme schemes, veteran of Indian desi hip-hop.',
    location: 'New Delhi, India',
    website: 'https://krsnamusic.com',
    isVerified: true,
  },
  {
    username: 'raftaar_kalamkaar',
    displayName: 'Raftaar ⚡',
    bio: 'Rapper, music producer, entrepreneur. Supporting underground talent through Kalamkaar.',
    location: 'Delhi, India',
    website: 'https://kalamkaar.in',
    isVerified: true,
  },
  {
    username: 'badshah_hits',
    displayName: 'Badshah 🔊',
    bio: 'Chart-topping producer, rapper, hitmaker. Global desi sounds that dominate the dancefloor.',
    location: 'Chandigarh / Mumbai',
    website: 'https://badshahmusic.com',
    isVerified: true,
  },
  {
    username: 'diljit_dosanjh_punjab',
    displayName: 'Diljit Dosanjh 🪕',
    bio: 'Born to Shine. Coachella performer, Punjabi folk ambassador and actor.',
    location: 'Ludhiana / California',
    website: 'https://diljitdosanjh.com',
    isVerified: true,
  },
  {
    username: 'karan_aujla_geetan',
    displayName: 'Karan Aujla 🖋️',
    bio: 'Geetan Di Machine. Raw lyricism, Punjabi hooks and international crossover tracks.',
    location: 'Ghurani / Vancouver',
    website: 'https://karanaujlamusic.com',
    isVerified: true,
  },
  {
    username: 'sidhu_legacy_beats',
    displayName: 'Moose Tape Archive 🌾',
    bio: 'Preserving the cultural revolution and folk legacy of legendary Punjabi music.',
    location: 'Mansa, Punjab',
    website: 'https://moosetape.org',
    isVerified: false,
  },
  {
    username: 'shubh_still_rollin',
    displayName: 'Shubh 🚗',
    bio: 'Melodic hip-hop and trap rhythms. No Offence, Still Rollin and global streaming charts.',
    location: 'Punjab / Toronto',
    website: 'https://shubhmusic.com',
    isVerified: false,
  },
  {
    username: 'apj_abdul_kalam_tribute',
    displayName: 'Wings of Fire Foundation 🚀',
    bio: 'Ignited minds, youth science fellowships & grassroots innovation across Indian schools.',
    location: 'Rameswaram, Tamil Nadu',
    website: 'https://ignitedminds.in',
    isVerified: true,
  },
  {
    username: 'sundar_pichai_tech',
    displayName: 'Sundar Tech Perspectives 🌐',
    bio: 'Computing at scale, accessible AI for billions, and the future of open information.',
    location: 'Mountain View / Madurai',
    website: 'https://futurecompute.org',
    isVerified: true,
  },
  {
    username: 'satya_nadella_cloud',
    displayName: 'Satya Digital Systems ☁️',
    bio: 'Empathy in leadership, cloud scale infrastructure and empowering every organization.',
    location: 'Redmond / Hyderabad',
    website: 'https://hitempower.org',
    isVerified: true,
  },
  {
    username: 'aravind_srinivas_ai',
    displayName: 'Aravind Srinivas 🔍',
    bio: 'Curiosity engines, real-time knowledge synthesis and conversational search.',
    location: 'San Francisco, CA',
    website: 'https://answersai.tech',
    isVerified: true,
  },
  {
    username: 'percy_liang_nlp',
    displayName: 'Percy Liang 🧠',
    bio: 'Foundation models, holistic evaluation of language systems and transparent AI benchmark standards.',
    location: 'Stanford, CA',
    website: 'https://stanfordnlp.edu',
    isVerified: false,
  },
  {
    username: 'lex_fridman_conversations',
    displayName: 'Lex Fridman 🤖',
    bio: 'Long-form podcast conversations on AI, philosophy, history, physics, love and power.',
    location: 'Austin, Texas',
    website: 'https://lexfridman.com',
    isVerified: true,
  },
  {
    username: 'andrej_karpathy_neural',
    displayName: 'Andrej Karpathy 🧠',
    bio: 'Deep neural nets, micrograd, nanoGPT & training machines to understand the physical world.',
    location: 'San Francisco, CA',
    website: 'https://karpathy.ai',
    isVerified: true,
  },
];

async function main() {
  console.log('🚀 Starting Seeding of 100 Users on VARTA...');
  console.log(`Input profiles count: ${RAW_PROFILES.length}`);

  // 1. Compute default Argon2 password hash once for all users
  const defaultPassword = 'Varta@2026Secure!';
  console.log('🔐 Computing Argon2 hash for default password...');
  const passwordHash = await argon2.hash(defaultPassword);
  console.log('✅ Password hash generated.');

  // 2. Fetch existing users to avoid username/email collisions
  const existingUsers = await prisma.user.findMany({
    select: { id: true, username: true, email: true },
  });
  const existingUsernames = new Set(existingUsers.map((u) => u.username.toLowerCase()));
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
  console.log(`Found ${existingUsers.length} existing users in DB.`);

  const createdUserIds = [];

  // 3. Create or collect the 100 users
  for (let i = 0; i < RAW_PROFILES.length; i++) {
    const p = RAW_PROFILES[i];
    const email = `${p.username}@varta.community`;
    const avatarUrl = AVATAR_URLS[i % AVATAR_URLS.length];
    const coverUrl = COVER_URLS[i % COVER_URLS.length];

    if (existingUsernames.has(p.username.toLowerCase())) {
      console.log(`[${i + 1}/100] User "${p.username}" already exists. Ensuring profile picture and cover picture are updated...`);
      const existing = await prisma.user.findUnique({
        where: { username: p.username },
        include: { profile: true },
      });
      if (existing) {
        createdUserIds.push(existing.id);
        if (!existing.profile) {
          await prisma.userProfile.create({
            data: {
              userId: existing.id,
              displayName: p.displayName,
              bio: p.bio,
              location: p.location,
              website: p.website,
              avatarUrl,
              coverUrl,
            },
          });
        } else if (!existing.profile.avatarUrl || !existing.profile.coverUrl) {
          await prisma.userProfile.update({
            where: { userId: existing.id },
            data: {
              avatarUrl: existing.profile.avatarUrl || avatarUrl,
              coverUrl: existing.profile.coverUrl || coverUrl,
            },
          });
        }
      }
      continue;
    }

    try {
      const newUser = await prisma.user.create({
        data: {
          username: p.username,
          email,
          passwordHash,
          role: 'USER',
          status: 'ACTIVE',
          isVerified: p.isVerified,
          isPrivate: false,
          emailVerifiedAt: new Date(),
          profile: {
            create: {
              displayName: p.displayName,
              bio: p.bio,
              location: p.location,
              website: p.website,
              avatarUrl,
              coverUrl,
            },
          },
          notificationPref: {
            create: {},
          },
        },
      });

      createdUserIds.push(newUser.id);
      if ((i + 1) % 10 === 0 || i === RAW_PROFILES.length - 1) {
        console.log(`[${i + 1}/100] Created user: @${newUser.username} (${p.displayName})`);
      }
    } catch (err) {
      console.error(`Error creating user @${p.username}:`, err.message);
    }
  }

  console.log(`\n🎉 Total target users processed: ${createdUserIds.length}`);

  // 4. Randomly connect each user with each other
  console.log('\n🔗 Generating random follow network connections between all users...');
  const followPairsSet = new Set();
  const followRecords = [];

  // Combine target users with any existing users so everyone is integrated
  const allUserIds = Array.from(new Set([...existingUsers.map((u) => u.id), ...createdUserIds]));
  console.log(`Total user pool size for connections: ${allUserIds.length}`);

  // Find specific user IDs to ensure connections to (e.g. raka92 and varta_official)
  const rakaUser = existingUsers.find((u) => u.username === 'raka92');
  const adminUser = existingUsers.find((u) => u.username === 'varta_official');

  for (const userId of createdUserIds) {
    // Each user follows between 15 and 35 other random users
    const connectionCount = 15 + Math.floor(Math.random() * 20); // 15 to 34
    const availableTargets = allUserIds.filter((id) => id !== userId);
    
    // Shuffle targets
    const shuffled = availableTargets.sort(() => 0.5 - Math.random());
    const selectedTargets = shuffled.slice(0, connectionCount);

    // 40% chance of also following raka92 and admin if not already included
    if (rakaUser && rakaUser.id !== userId && Math.random() < 0.45) {
      selectedTargets.push(rakaUser.id);
    }
    if (adminUser && adminUser.id !== userId && Math.random() < 0.55) {
      selectedTargets.push(adminUser.id);
    }

    for (const targetId of selectedTargets) {
      const pairKey = `${userId}_${targetId}`;
      if (!followPairsSet.has(pairKey)) {
        followPairsSet.add(pairKey);
        followRecords.push({
          followerId: userId,
          followingId: targetId,
        });
      }
    }
  }

  // Also make raka92 follow 25 interesting users from the 100 so raka's feed is super rich!
  if (rakaUser) {
    const rakaTargets = createdUserIds
      .filter((id) => id !== rakaUser.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 25);
    for (const tId of rakaTargets) {
      const pairKey = `${rakaUser.id}_${tId}`;
      if (!followPairsSet.has(pairKey)) {
        followPairsSet.add(pairKey);
        followRecords.push({
          followerId: rakaUser.id,
          followingId: tId,
        });
      }
    }
  }

  console.log(`Generated ${followRecords.length} unique follow connections.`);
  console.log('Inserting follow connections into database...');

  const batchSize = 500;
  let insertedCount = 0;
  for (let i = 0; i < followRecords.length; i += batchSize) {
    const chunk = followRecords.slice(i, i + batchSize);
    const result = await prisma.follow.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    insertedCount += result.count;
    console.log(`Inserted ${insertedCount} / ${followRecords.length} follow connections...`);
  }

  console.log(`\n✅ Successfully seeded and connected all users!`);
  console.log(`Total new follows recorded: ${insertedCount}`);

  // 5. Verification summary
  const totalUsersInDb = await prisma.user.count();
  const totalFollowsInDb = await prisma.follow.count();
  console.log(`\n📊 DATABASE SUMMARY:`);
  console.log(`- Total Users in DB: ${totalUsersInDb}`);
  console.log(`- Total Follow Connections in DB: ${totalFollowsInDb}`);
  if (rakaUser) {
    const rakaFollowers = await prisma.follow.count({ where: { followingId: rakaUser.id } });
    const rakaFollowing = await prisma.follow.count({ where: { followerId: rakaUser.id } });
    console.log(`- @raka92 Social Graph: ${rakaFollowers} Followers, ${rakaFollowing} Following`);
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
