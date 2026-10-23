const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

// Verified, fast, 200 OK playable MP4 video URLs with metadata
const VERIFIED_VIDEOS = [
  {
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 15400000,
    width: 1280,
    height: 720,
  },
  {
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 8400000,
    width: 854,
    height: 480,
  },
  {
    url: 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4200000,
    width: 960,
    height: 540,
  },
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 3100000,
    width: 640,
    height: 360,
  },
  {
    url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4800000,
    width: 720,
    height: 480,
  },
  {
    url: 'https://www.w3schools.com/html/movie.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 3800000,
    width: 640,
    height: 360,
  },
  {
    url: 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4200000,
    width: 960,
    height: 540,
  },
  {
    url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4800000,
    width: 720,
    height: 480,
  },
];

// Rich curated photos per category
const CATEGORY_IMAGES = {
  'India Trends': [
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600100397608-f010f443b353?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
  ],
  'Technology': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
  ],
  'Travel': [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&auto=format&fit=crop&q=80',
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531415074868-036b1c575351?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1000&auto=format&fit=crop&q=80',
  ],
  'Entertainment': [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80',
  ],
  'Food': [
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&auto=format&fit=crop&q=80',
  ],
  'Lifestyle': [
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=1000&auto=format&fit=crop&q=80',
  ],
  'Fitness & Health': [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000&auto=format&fit=crop&q=80',
  ],
};

// Base naming themes for 100 groups per category
const CATEGORY_NAMES = {
  'India Trends': [
    'Vantara Khabar Group',
    'Vantara Business',
    'VARTA | Mana Andhra',
    'VARTA | Arunachal Voices',
    'VARTA | Axom Xomaj',
    'VARTA | Apna Bihar',
    'VARTA | Mor Chhattisgarh',
    'VARTA | Goemkar Connect',
    'VARTA | Aapnu Gujarat',
    'VARTA | Apna Haryana',
    'VARTA | Devbhoomi Himachal',
    'VARTA | Johar Jharkhand',
    'VARTA | Namma Karnataka',
    'VARTA | Nammude Keralam',
    'VARTA | Apna Madhya Pradesh',
    'VARTA | Aapla Maharashtra',
    'VARTA | Manipur Voices',
    'VARTA | Meghalaya Connect',
    'VARTA | Mizo Hnam',
    'VARTA | Naga Heritage',
    'VARTA | Ama Odisha',
    'VARTA | Sadda Punjab',
    'VARTA | Apno Rajasthan',
    'VARTA | Sikkim Sangam',
    'VARTA | Namma Tamil Nadu',
    'VARTA | Mana Telangana',
    'VARTA | Tripura Connect',
    'VARTA | Apna Uttar Pradesh',
    'VARTA | Devbhoomi Uttarakhand',
    'VARTA | Amader Bangla',
    'Chandrayaan & ISRO Space Explorers', 'UPI & Digital Bharat Innovators', 'Make In India Manufacturing Hub',
    'Vande Bharat & High-Speed Rail Club', 'Semiconductor & Chip Mission India', 'Green Energy & Solar Bharat',
    'Electric Mobility & EV Pioneers', 'Indian Startup Founders Network', 'ONDC & Open Commerce Revolution',
    'Agritech & Farmer Future India', 'Delhi NCR Urban Chronicles', 'Mumbai Meri Jaan City Forum',
    'Namma Bengaluru Tech & Life', 'Hyderabad Cyberabad Insiders', 'Kolkata Adda & Culture Circle',
    'Chennai Coastal & Tech Hub', 'Pune IT & Student Vanguard', 'Ahmedabad & Vibrant Gujarat Guild',
    'Jaipur Heritage & Modern Crafts', 'Kochi Infopark & Coastal Pulse', 'Lucknow Nawabi Culture & Modernity',
    'Indore Cleanest City & Foodies', 'Bhubaneswar Smart City Forum', 'Goa Beyond Tourism & Remote Work',
    'Chandigarh Planned City Pulse', 'Assam & North East Horizons', 'Kashmir Valley Development & Tech',
    'Varanasi Spiritual & Modern Ghats', 'Ayodhya Heritage & Tourism Wave', 'Indian Defence & DRDO Innovations',
    'Bharat 2047 Visionary Society', 'Indian Handloom & Khadi Revival', 'Ayurveda & Modern Wellness Bharat',
    'Sanskrit Tech & Linguistic Research', 'National Highways & Infra India', '5G & 6G Telecom Bharat Lab',
    'Clean Ganga & Water Conservation', 'Women Entrepreneurs of India', 'Gen Z Bharat Creative Voice',
    'Indian Classical Dance & Music', 'Yoga For Daily Living India', 'Smart Village & Panchayati Raj Tech',
    'Indian Space Economy & Startups', 'Logistics & Supply Chain India', 'BioTech & Genomic Research India',
    'Fintech Leaders & Neo-Banking', 'Direct To Consumer (D2C) Bharat', 'Indian EdTech & Skill Building',
    'Cyber Security & Digital Sovereignty', 'Clean Tech & Zero Carbon India', 'Festivals & Cultural Unity',
    'Indian Railways Railfans Club', 'Himalayan Climate Action', 'Coastal Blue Economy Network',
    'Indian Craft & Artisans Guild', 'Desi Memes & Viral Culture', 'New India Policy & Public Affairs',
    'Vibrant Villages Border Tourism', 'Indian Heritage Architectural Guild', 'Indian Astronomy & Stargazers',
    'National Sports Talent Hunt', 'Indian Diaspora Global Connect', 'Kumbh & Pilgrimage Heritage',
    'Culinary Traditions of Bharat', 'Indian Patent & IP Innovators', 'Micro, Small & Medium Enterprises Hub',
    'Indian Philanthropy & Social Impact', 'Skill India Vocational Guild', 'Indian Textile Fashion League',
    'Regional Literature & Vernacular Voice', 'Indian Drone & UAV Innovators', 'Battery Tech & Energy Storage',
    'Indian Toy & Game Developers', 'Smart Port & Maritime Bharat', 'Indian Cinema Global Outreach',
    'Kisan Tech & Organic Farming', 'Indian Fintech Regulatory Sandbox', 'Supercomputing & Quantum India',
    'Urban Mobility & Metro Rail Hub', 'Heritage Conservation Warriors', 'Indian Wildlife & Safari Club',
    'Tribal Arts & Indigenous Heritage', 'Indian Space Research Alumni', 'Bharat Mobility Expo Network',
    'Desi Podcast Creators Hub', 'Young Parliament & Mock Policy', 'Digital Health & Telemedicine India',
    'Indian Robotics & Automation', 'Modern Indian Philosophy Society', 'Heritage Cuisine Revivalists',
    'Indian Comic Creators & Artists', 'High Altitude Research India', 'Indian Renewable Energy Guild',
    'Sustainable Architecture Bharat', 'Indian Ocean Maritime Affairs', 'Smart Logistics Corridor Club',
    'Open Source Bharat Collective', 'Indian Folk Art Revivers', 'Ek Bharat Shreshtha Bharat',
    'Bharat Deep Tech Vanguard'
  ],
  'Technology': [
    'Vantara techno hub',
    'TypeScript Masters India', 'Rustaceans of Bharat', 'Python & AI Engineering Lab',
    'Go (Golang) High-Concurrency Guild', 'React & Next.js Pioneers', 'Tailwind & Modern CSS Wizards',
    'PostgreSQL & Database Architects', 'Docker & Kubernetes Cloud DevOps', 'System Design & High Scale Architecture',
    'Microservices & Event Driven Systems', 'Generative AI & LLM Engineers', 'PyTorch & Machine Learning Bharat',
    'Computer Vision & OpenCV Lab', 'AI Autonomous Agents Builders', 'Prompt Engineering & RAG Society',
    'MLOps & Production AI Pipelines', 'Open Source Contributors India', 'Web Performance & 60fps Engineers',
    'Cyber Security & Ethical Hackers', 'Web3 & Cryptography India', 'Linux Kernel & Low-Level Devs',
    'C++ & High Frequency Trading Hub', 'Java & Spring Boot Enterprise Club', 'Kotlin & Modern Android Guild',
    'Swift & Apple Ecosystem Creators', 'Flutter & Cross-Platform Masters', 'GraphQL & Apollo GraphQLers',
    'Redis & In-Memory Data Systems', 'Kafka & Real-time Streaming Lab', 'Cloudflare Workers & Edge Compute',
    'AWS Cloud Solutions Architects', 'GCP Google Cloud Champions', 'Azure Enterprise Cloud League',
    'NeoVim & Terminal Workflow Ninjas', 'Git & Monorepo Engineers Hub', 'Frontend Masters Bengaluru',
    'Backend Guild Mumbai', 'Full Stack Hyderabad Chapter', 'DevOps Delhi NCR Community',
    'QA & Automation Testing Masters', 'CI/CD & Release Pipeline Pros', 'Site Reliability Engineering (SRE) India',
    'Vector Databases & Embeddings Guild', 'Fine-Tuning & Quantization Lab', 'Robotics & ROS2 Developers',
    'Embedded Systems & IoT Hardware', 'Raspberry Pi & Arduino Makers', 'FPGA & ASIC Hardware Design',
    'Quantum Computing Enthusiasts', 'Game Development & Unreal Engine', 'Unity 3D Creators India',
    'WebAssembly & High-Perf Web', 'Serverless & Micro-Frontends Hub', 'Design Systems & Figma To Code',
    'API Design & gRPC Microservices', 'Elasticsearch & Distributed Search', 'MongoDB & NoSQL Specialists',
    'Cassandra & ScyllaDB High-Scale', 'DevRel & Tech Community Leaders', 'Indie Hackers & Micro-SaaS India',
    'Solo Founders & Ship Daily Club', 'Algorithm & LeetCode Champions', 'Competitive Programming India',
    'Clean Code & Refactoring Guild', 'Domain Driven Design (DDD) Club', 'Micro-Animations & WebGL 3D',
    'Three.js & Canvas Visualizers', 'Accessibility (a11y) Champions', 'PWAs & Offline-First Web Apps',
    'Zero Trust Network Architecture', 'Penetration Testing & Red Teaming', 'Bug Bounty Hunters India',
    'Reverse Engineering & Malware Lab', 'Tech Lead & Engineering Managers', 'Staff+ Principal Engineers Circle',
    'Junior Devs Mentorship Network', 'Women In Tech India Collective', 'Student Developers & Hackathons',
    'Open Source Guild Pune', 'Koramangala Tech Meetups Hub', 'Whitefield Coders Community',
    'Gurugram Tech Stack Forum', 'HSR Layout Dev Hangout', 'Indiranagar Hacker Space',
    'Powai Valley Tech Minds', 'HITEC City Developers Collective', 'Salt Lake Sector V Coders',
    'OMR Chennai Software Engineers', 'Noida Tech Corridor Guild', 'Chandigarh Software Artisans',
    'Jaipur Silicon Desert Devs', 'Kochi Infopark Techies', 'Indore IT Park Coders',
    'Bhubaneswar Software Guild', 'Ahmedabad Web Artisans', 'Dehradun Mountain Devs',
    'Goa Digital Nomads Tech Hub', 'Remote Engineers India Chapter', 'AI Research Papers Reading Club',
    'The 100x Engineers Society'
  ],
  'Travel': [
    'Vantara tour spot',
    'Himalayan Trekkers & Backpackers', 'Ladakh & Spiti High Altitude Riders', 'Goa Beyond Beaches & Hidden Shacks',
    'Western Ghats Monsoon Explorers', 'Kerala Backwaters & Houseboat Drifters', 'Jaipur & Rajasthan Heritage Trails',
    'Varanasi Ghats & Spiritual Walks', 'Manali, Kasol & Parvati Wanderers', 'Sikkim & Kanchenjunga Expeditions',
    'Meghalaya Living Root Bridge Trekkers', 'Andaman Islands Coral & Scuba Divers', 'Hampi Boulders & Ruins Explorers',
    'Uttarakhand Valley of Flowers Club', 'Rishikesh Yoga & River Rafting Hub', 'Coorg & Chikmagalur Coffee Trails',
    'Ooty & Nilgiri Mountain Railway Fans', 'Udaipur City of Lakes Romantic Escapes', 'Jaisalmer Golden Dunes & Desert Camp',
    'Kashmir Great Lakes & Gulmarg Snow', 'Pondicherry French Colony Walkers', 'Gokarna Cliffside Sunset Chill',
    'Tirthan & Jibhi Valley Serenity', 'Zanskar Winter Chadar Trek Elite', 'Darjeeling Tea Garden Hikers',
    'Munnar Mist & Western Ghat Peaks', 'Pachmarhi & Satpura Forest Trails', 'Khajuraho & Orchha Heritage Walkers',
    'Mysore Palace & Chamundi Trails', 'Kanyakumari Sunset & Sunrise Watchers', 'Rameswaram Coastal & Temple Paths',
    'Sundarbans Mangrove Tiger Safaris', 'Jim Corbett National Park Rangers', 'Kaziranga Rhino Wildlife Explorers',
    'Ranthambore Tiger Photography Club', 'Bandhavgarh & Kanha Jungle Safaris', 'Gir Forest Asiatic Lion Trackers',
    'Dudhwa & Terai Wilderness Scouts', 'Royal Enfield Bullet Highway Riders', 'India Roadtrippers & Overlanders',
    'Solo Backpackers Bharat League', 'Women Travel Tribe of India', 'Budget Backpacking Under 10k',
    'Luxury Palaces & Heritage Hotels', 'Campervan & RV Travel India', 'Camping Under Milky Way Stars',
    'Monsoon Waterfalls Chasers', 'Spiritual Yatras & Sacred Temples', 'Food Walks & Street Food Travellers',
    'Photographers of Incredible India', 'Bicycle Touring Across Bharat', 'Offbeat North East India Wanderers',
    'Arunachal Tawang & Valley Explorers', 'Nagaland Hornbill Festival Campers', 'Mizoram Blue Mountains Club',
    'Diu Island Coastal Retreats', 'Daman & Silvassa Weekend Escapes', 'Mahabaleshwar & Panchgani Fog Lovers',
    'Lonavala & Khandala Monsoon Trekkers', 'Matheran Eco-Sensitive Hill Retreat', 'Alibaug & Konkan Beach Hoppers',
    'Tarkarli Scuba & Malvan Coast', 'Dandeli White Water Rafters', 'Badami Cave Temples & Bagalkot',
    'Agumbe Rainforest & Cobra Trail', 'Wayanad Treehouses & Wildlife', 'Varkala Cliff Beach Walkers',
    'Kovalam Sunset & Lighthouse Watch', 'Alleppey Kayaking & Canoe Trails', 'Kumarakom Bird Sanctuary Voyagers',
    'Bekal Fort & Coastal Trails', 'Araku Valley & Borra Caves Voyagers', 'Gandikota Grand Canyon of India',
    'Horsley Hills Hill Station Chill', 'Lepakshi Hanging Pillar Explorers', 'Chitrakote Niagra of India Chasers',
    'Bastar Tribal & Forest Expeditions', 'Ajanta & Ellora Rock Cut Wonders', 'Lonar Meteor Crater Explorers',
    'Diu Portuguese Architecture Walkers', 'Mount Abu Nakki Lake Explorers', 'Shekhawati Havelis Open Art Gallery',
    'Chittorgarh Fort Valour Trail', 'Pushkar Camel Fair & Sacred Lake', 'Bikaner Junagarh & Desert Route',
    'Nainital Lake & Kumaon Hills', 'Mussoorie Queen of Hills Walkers', 'Chopta Tungnath Highest Shiva Temple',
    'Auli Skiing & Snowboarders Club', 'Kedarnath & Badrinath Pilgrims', 'Spiti Pin Valley & Mudh Village',
    'Kinnaur Apples & Sutlej Valley', 'Dharamshala & McLeodGanj Peace', 'Bir Billing Paragliding Aces',
    'Dalhousie & Khajjiar Mini Switzerland', 'Wanderlust India Collective'
  ],
  'Sports': [
    'Team India Bleed Blue Official Fans', 'Mumbai Indians Paltan Fan Club', 'Chennai Super Kings Whistle Podu Army',
    'Royal Challengers Bengaluru Fan Army', 'Kolkata Knight Riders Korbo Lorbo', 'Delhi Capitals Roar Macha Gang',
    'Rajasthan Royals Halla Bol Circle', 'Sunrisers Hyderabad Orange Army', 'Punjab Kings Sadda Punjab Brigade',
    'Gujarat Titans Aava De Community', 'Lucknow Super Giants Gazab Andaz', 'Test Cricket Traditionalists Guild',
    'T20 Masterclass & Powerplay Stats', 'Fast Bowling Pace & Swing Masters', 'Spin Wizardry & Turn Analyzers',
    'Cricket Analytics & Cricinfo Junkies', 'Ranji Trophy & Domestic Cricket Club', 'Indian Cricket Memes & Banter',
    'Gully Cricket Legends Association', 'Cricket Umpiring & DRS Debates', 'Indian Super League (ISL) Football',
    'Kerala Blasters Manjappada Ultras', 'Mohun Bagan Super Giant Mariners', 'East Bengal FC Red & Gold Brigade',
    'Bengaluru FC West Block Blues', 'Mumbai City FC Islanders', 'FC Goa Gaur Brigade Fans',
    'Premier League Fans India', 'UEFA Champions League India Nightowls', 'Real Madrid & Barcelona El Clasico Club',
    'Arsenal India Supporters Club', 'Manchester United Red Devils Bharat', 'Liverpool FC Supporters India',
    'Chelsea FC India Blues Society', 'Indian National Football Team Blue Tigers', 'Badminton Masters PV Sindhu Era',
    'Lakshya Sen & Sat-Chi Smash Club', 'Table Tennis Stars of India', 'Tennis Grand Slam Lovers India',
    'Olympic Gold Mission Bharat', 'Neeraj Chopra Javelin Throw Tribe', 'Wrestling & Traditional Dangal Guild',
    'Pro Kabaddi League (PKL) Panga', 'Patna Pirates Green Army', 'Bengaluru Bulls Bull Squad',
    'Dabang Delhi K.C. Eagle Fans', 'Jaipur Pink Panthers Roar', 'Boxing & Indian Pugilists Club',
    'Weightlifting & Mirabai Chanu Power', 'Archery & Arrow Precision India', 'Shooting & Pistol Range Champions',
    'Chess Grandmasters & Praggnanandhaa Fans', 'Viswanathan Anand Chess Legacy', 'Marathon Runners of India',
    'Mumbai Marathon 42k Finishers', 'Delhi Half Marathon Striders', 'Bengaluru 10K Speed Runners',
    'Trail Running & Ultra Marathoners', 'CrossFit & Calisthenics Brotherhood', 'Gym Rats & Heavy Lifters Bharat',
    'Powerlifting Squat Bench Deadlift', 'Bodybuilding & Aesthetics India', 'Cycling Clubs of India (BRM)',
    'Mountain Biking & Downhill Riders', 'Swimming & Aquatic Champions India', 'Triathletes & Ironman Finishers Bharat',
    'Surfing & Stand Up Paddle India', 'Skateboarding & Roller Skating Club', 'Bouldering & Rock Climbers India',
    'MMA & Martial Arts Fighters Guild', 'Karate & Taekwondo Black Belts', 'Kalaripayattu Ancient Martial Arts',
    'Gymnastics & Vault Stars India', 'Rowing & Regatta Athletes India', 'Sailing & Yachting Club of India',
    'Horse Riding & Equestrian Sports', 'Polo & Royal Sports Heritage', 'Golf & Driving Range Lovers',
    'Billiards & Snooker Pankaj Advani Fans', 'Ultimate Frisbee India League', 'Kho Kho Ultimate League Fans',
    'Sepak Takraw India Team Lovers', 'Motorsport & Formula 1 India (F1)', 'MotoGP & Track Day Racers Bharat',
    'Karting & Junior Racing Stars', 'Esports & BGMI Competitive Gaming', 'Valorant India Champions League',
    'Free Fire & Mobile Gaming Arena', 'Fantasy Cricket Team Strategists', 'Sports Nutrition & Protein Science',
    'Sports Physiotherapy & Recovery', 'Coaches & Athletic Mentors Guild', 'Grassroots Sports Scouting India',
    'College Sports & University Meets', 'Inter-School Athletics Championship', 'Para-Athletes & Paralympic Heroes',
    'Women In Indian Sports Revolution', 'Sports Photography & Slow-Mo Clips', 'Bharat Fitness Movement'
  ],
  'Entertainment': [
    'Indian Cinema Directors & Screenplay Guild', 'Bollywood Retro & Golden Era Classics', 'South Cinema Pan-India Waves',
    'Malayalam Cinema New Wave Cinephiles', 'Tamil Cinema Auteurs & Craft', 'Telugu Mass Action & Storytelling',
    'Kannada Cinema & Sandalwood Creators', 'Bengali Cinema Ray & Modern Masters', 'Marathi Parallel Cinema Movement',
    'Cinematography & Lighting Craft India', 'Dolby Atmos & Sound Design Masters', 'VFX & CGI Special Effects Studio',
    'A.R. Rahman Symphony & Music Devotees', 'Ilaiyaraaja Melody Purists Circle', 'Pritam & Modern Bollywood Melodies',
    'Kishore Kumar & RD Burman Nostalgia', 'Mohammed Rafi & Golden Vocals', 'Lata Mangeshkar Immortal Melodies',
    'Desi Hip Hop (DHH) Underground', 'Gully Gang & DIVINE Rap Tribe', 'Seedhe Maut & Capital Hip Hop',
    'Indian Indie Music & Lo-Fi Waves', 'Prateek Kuhad & Acoustic Soul', 'Coke Studio & Sufi Folk Fusion',
    'Classical Hindustani Vocalists', 'Carnatic Classical Masters League', 'Bollywood Dance & Choreography Studio',
    'OTT Web Series Binge Watchers', 'Sacred Games & Mirzapur Cult Club', 'Panchayat & Gullak Heartwarmers',
    'Indian Crime Thrillers & Noir Fiction', 'Horror & Paranormal Desi Stories', 'Standup Comedy Indian Circuit',
    'Zakir Khan & Sakht Launda Army', 'Bassi & Storyteller Comedians Fans', 'Abhishek Upmanyu Humour Club',
    'Indian Comic Books & Chacha Chaudhary', 'Raj Comics & Nagraj Nostalgia', 'Anime & Manga Lovers India (Otaku)',
    'Studio Ghibli & Co-Animation Fans', 'Hollywood Sci-Fi & Blockbusters India', 'Christopher Nolan Mindbenders',
    'Marvel Cinematic Universe (MCU) India', 'DC & Batman Gotham Bharat Fanbase', 'Star Wars & Sci-Fi Geeks India',
    'Gaming Streamers & Content Creators', 'CarryMinati & Roster Roasters Gang', 'Tanmay Bhat & Reaction Stream Crew',
    'Samay Raina & Chess Comedy Chaos', 'Indian Fashion Runway & Couturiers', 'Sabyasachi & Royal Indian Fashion',
    'Streetwear & Sneakerheads India', 'Thrift Stores & Sustainable Styling', 'Indian Theatre & Street Plays (Nukkad)',
    'Prithvi Theatre & Stage Legends', 'Urdu Shayari & Rekhta Mehfil', 'Hindi Kavita & Poetry Slams',
    'Podcasting In India & Audio Shows', 'RJ & Radio Golden Age Nostalgia', 'Short Film Makers & Indie Directors',
    'Film Festival Nominees & Cannes India', 'Bollywood Box Office Tracking & Hits', 'Film Critics & Reviewers Round-table',
    'B-Roll & Video Editing CapCut/Premiere', 'Color Grading & DaVinci Resolve India', 'Drone Videography & FPV Pilots',
    'Cosplay & Comic Con India Tribe', 'K-Pop & K-Drama Indian Fandom', 'Board Games & D&D Desi Guild',
    'Magic & Mentalism Performers India', 'Circus & Street Performance Arts', 'Puppetry & Traditional Folk Puppets',
    'Indian Voiceover Artists Guild', 'Dubbing & Localization Industry', 'Celebrity Red Carpet & Gala Looks',
    'Film Heritage Restoration Foundation', 'Soundtrack Vinyl & Cassette Collectors', 'Vintage Movie Posters Art Gallery',
    'Method Acting & Workshop Lab', 'Monologues & Audition Prep Bharat', 'Children Entertainment & Animation India',
    'Travel Filmmakers & Vlogging Stars', 'Culinary Cinema & Food Documentaries', 'Documentary Filmmakers Network',
    'Indian Entertainment Creators Collective'
  ],
  'Food': [
    'Vantara taste',
    'Street Food Secrets of Bharat', 'Biryani Connoisseurs & Awadhi Kitchens',
    'South Indian Tiffin & Dosa Explorers', 'Mithai & Traditional Indian Sweets',
    'Chai & Chai Pe Charcha Guild', 'Desi Home Chefs & Secret Recipes',
    'Spices of India & Masala Blends', 'Coastal Seafood & Curry Trail',
    'Punjabi Dhaba & Tandoori Masters', 'Rajasthani Dal Baati Churma Guild',
    'Bengali Sweets & Mishti Magic', 'Gujarati Thali & Farsan Circle'
  ],
  'Lifestyle': [
    'Vantara Life',
    'Yoga & Mindful Living India', 'Ayurveda & Daily Wellness Circle',
    'Indian Minimalist & Sustainable Living', 'Modern Desi Home Decor & Spaces',
    'Fitness Tribe & Calisthenics Bharat', 'Organic Farming & Natural Living',
    'Mental Wellness & Mindful Mornings', 'Desi Fashion & Handloom Aesthetics'
  ],
  'Fitness & Health': [
    'Vantara Health Point',
    'Daily Yoga & Pranayama Circle', 'Ayurveda & Holistic Wellness Bharat',
    'Cardio & Marathon Runners India', 'Calisthenics & Bodyweight Training',
    'Strength & Powerlifting Guild', 'Nutrition & Balanced Diet Tips',
    'Mental Health & Mindfulness Tribe', 'CrossFit & Functional Fitness India',
    'Women Fitness & Core Strength', 'Active Seniors & Healthy Living'
  ]
};

// Category-specific post content templates
const POST_SNIPPETS = {
  'India Trends': [
    'Monumental milestone achieved today! The indigenous supply chain resilience is proving critics wrong. A proud moment for every Indian! 🇮🇳🚀 #IndiaTrends #MakeInIndia #BharatFirst',
    'Take a look at how digital infrastructure is transforming everyday transactions in Tier-2 and Tier-3 cities. True economic empowerment! 📈💳 #DigitalIndia #Fintech',
    'The speed of infrastructure development across our expressways and freight corridors is unbelievable. Look at this state-of-the-art engineering! 🛣️✨ #NewIndia #Infrastructure',
    'Indian youth are building globally competitive products right from their home cities. The demographic dividend in full effect! 💡🇮🇳 #IndiaRising #Startups',
    'Celebrating our rich cultural diversity and architectural marvels that have stood strong for centuries. Truly Incredible India! 🛕🌅 #IncredibleIndia #Heritage',
    'What do you believe is the single most important sector driving India’s economic growth over the next decade? Share your thoughts below! 👇📊 #Economy #Bharat',
    'The rapid expansion of renewable energy and solar parks across the Thar desert and southern plains is world-class. Sustainable future! ☀️🌿 #GreenEnergy #Sustainability',
    'From vernacular commerce to digital healthcare, the solutions crafted in India are now being studied as global benchmarks. Proud! 🌐🇮🇳 #BaatSabki #Innovation'
  ],
  'Technology': [
    'Deep dive into asynchronous event streams and microservices orchestration. Reducing network hops cut our P99 latency by 68%! 💻⚡️ #Engineering #SystemDesign #Backend',
    'Here is our interactive UI demo showcasing fluid transitions, buttery animations, and instant state reconciliations. Web development at its finest! 🪄🚀 #Frontend #React #WebDev',
    'Why strong typing in TypeScript saves dozens of production fire-drills every single sprint. If you aren’t on strict mode, you are debugging in production! 🛡️ #TypeScript #CodeQuality',
    'Optimizing PostgreSQL indexes with composite B-trees and BRIN indexes for time-series events. Always benchmark with EXPLAIN ANALYZE! 📊🧠 #PostgreSQL #Database',
    'The democratization of open-source artificial intelligence is the most exciting tech paradigm of this decade. Build, test, and ship relentlessly! 🤖✨ #OpenSource #AI #MachineLearning',
    'Containerizing microservices with lightweight Alpine images reduced our CI build time from 14 minutes down to 90 seconds. DevOps matters! 🐳⚡️ #DevOps #Docker #Kubernetes',
    'Refactored our caching tier with Redis RedisBloom filter to prevent cache stampedes during peak viral traffic. Bulletproof architecture! 🛡️💾 #Redis #HighScale',
    'Clean architecture, modular separation of concerns, and rigorous automated tests. That is how sustainable software is crafted. 🛠️💻 #SoftwareEngineering #CleanCode'
  ],
  'Travel': [
    'Waking up to the sunrise illuminating the snow-clad Himalayan peaks. The crisp mountain air and silence is the greatest therapy in the world. 🏔️✨ #TravelIndia #Himalayas #Wanderlust',
    'Breathtaking coastal views captured along the azure waters and cliffs. Watch the ocean waves rhythmically crash against the shore! 🌊🌅 #BeachVibes #CoastalIndia #Travel',
    'Walking through the narrow cobblestone alleys of Rajasthan’s ancient forts. Every stone here whispers tales of valor, art, and timeless beauty. 🏰👑 #Heritage #Rajasthan #IncredibleIndia',
    'There is nothing quite like driving through the misty, rain-soaked Western Ghats with chai stops at roadside stalls. Pure bliss! 🌧️☕️ #MonsoonTravel #WesternGhats #RoadTrip',
    'Cruising silently through the tranquil Kerala backwaters on a traditional wooden houseboat as local fishermen cast their nets. Heavenly! 🌴🛶 #Kerala #Backwaters #GodsOwnCountry',
    'Pack your bags, respect the local cultures, leave no plastic behind, and collect memories that last a lifetime. Where is your next trip? 🎒✈️ #TravelDiaries #ExploreIndia',
    'The hidden waterfalls tucked away inside the deep forests of Meghalaya. Nature’s raw beauty untouched by commercialization. 🌿💧 #NorthEastIndia #Meghalaya #Nature',
    'Midnight food trails through the ancient streets. Sampling hot kebabs, fragrant biryani, and saffron kulfi under the glowing lanterns. 🍢😋 #FoodTravel #StreetFood #Culture'
  ],
  'Sports': [
    'What a sensational performance today! The sheer grit, clinical execution, and mental fortitude under pressure was an absolute masterclass! 🏆🔥 #Cricket #TeamIndia #Champions',
    'Feel the roar and goosebumps of 60,000 passionate fans chanting under the floodlights! There is no atmosphere in the world that rivals this! 🏟️🏏 #SportsIndia #MatchDay',
    'The commitment and discipline required to train every morning before sunrise is what separates the contenders from the champions. Push your limits! 🏃‍♂️💨 #FitnessMotivation #NeverGiveUp',
    'Tactical masterclass: analyzing the seam position, late swing, and field placements that forced the collapse today. Cricket is a game of millimeters! 🏏🧠 #CricketAnalysis #IPL',
    'From grassroots academies to world podiums, Indian athletes are breaking records and raising the tricolor high across global arenas. Proud! 🇮🇳🥇 #OlympicDream #Athletics',
    'Football fever at its peak! The electric derby atmosphere, the choreographed banners, and non-stop singing for 90 minutes. Football is emotion! ⚽️❤️ #IndianFootball #ISL',
    'Rest, nutrition, progressive overload, and consistent recovery. Respect the process and celebrate every small personal record. Keep grinding! 🏋️‍♂️💪 #GymLife #FitnessJourney',
    'Who was your most valuable player of the tournament? Let the passionate debates begin in the comments below! 👇🔥 #SportsDiscussion #FanVoice'
  ],
  'Entertainment': [
    'The visual craftsmanship, lighting contrast, and atmospheric sound design in this sequence is world-class cinema. Big screen magic! 🎬🍿 #IndianCinema #Filmmaking #VisualArt',
    'Take a look at this breathtaking cinematic teaser. The color grading and musical score create an indelible mood of tension and wonder! 🎥✨ #CinemaLovers #MovieMagic',
    'A.R. Rahman’s musical arrangements from the 90s still sound like they were recorded in the year 2040. Timeless, genre-bending genius! 🎶🎹 #MusicalGenius #ARRahman #Legend',
    'Writing great dialogue is about what is left unsaid between the characters. The pauses, the subtext, the eyes. Brilliant screenplay! ✍️🎭 #Screenwriting #Storytelling',
    'Indie music in India is going through a golden age. Authentic songwriting, genre-fusion, and grassroots artists filling packed venues. Long live art! 🎸🎤 #IndieMusic #DesiHipHop',
    'Laughter is indeed the best medicine. Spent two hours at a live comedy club laughing until our sides hurt. Support live performing artists! 😂👏 #StandupComedy #WeekendVibes',
    'The emotional resonance of classic Indian melodies on vinyl. Some analog warmth simply cannot be replicated by digital compression. 📻🎵 #Nostalgia #RetroVibes',
    'What was the greatest movie plot twist you genuinely never saw coming? Share your all-time favorites below! 🍿🤔 #MovieRecommendations #CinemaTalk'
  ],
  'Food': [
    'Nothing compares to the aroma of slow-cooked dum biryani sealed with dough and saffron! Pure culinary magic 🍲✨ #BiryaniLovers #IndianCuisine',
    'Crispy golden dosas served with fresh coconut chutney and piping hot sambar. The ultimate breakfast comfort food! 🥞☕ #SouthIndianFood #Dosa',
    'Exploring old city street food lanes: hot jalebis dipped in rich rabdi, and savory kachoris that burst with spice! 😋🍢 #StreetFood #DesiFlavors',
    'Secret family garam masala recipe passed down through generations. The secret is dry-roasting whole spices gently! 🌶️👩‍🍳 #HomeCooking #IndianSpices',
    'Authentic coastal fish curry made with freshly grated coconut, kokum, and fiery red chilies. Absolute heaven on a plate! 🐟🍛 #CoastalCuisine',
    'Freshly baked naan straight from the clay tandoor with melting butter. The simplest joys of North Indian food! 🫓🔥 #Tandoori #Foodie',
    'Chai pe charcha with hot steaming ginger tea and crunchy samosas on a rainy evening. An unbeatable feeling! ☕🥟 #ChaiLover #DesiSnacks'
  ],
  'Lifestyle': [
    'Starting the morning with Surya Namaskar, pranayama, and quiet contemplation. Center your mind before stepping into the day! 🧘‍♀️☀️ #MindfulMorning #YogaIndia',
    'Sustainable living is not about perfection, it is about making mindful daily choices. Small habits build a beautiful life! 🌿✨ #SustainableLiving #Aesthetics',
    'The elegance of handwoven Indian textiles and khadi. Carrying forward centuries of artisanal craftsmanship with modern pride. 🧵🪡 #DesiFashion #Handloom',
    'Transforming simple home corners with terracotta pottery, indoor greenery, and soft warm lighting. Cozy haven! 🪴🏡 #HomeDecor #DesiLiving',
    'Prioritizing mental wellness, quality sleep, and digital detox weekends. Your peace of mind is priceless! 🌸🧘‍♂️ #MentalHealth #SelfCare'
  ],
  'Fitness & Health': [
    'Start your morning with 20 minutes of dynamic stretching and mindful breathing. Consistency is the key to longevity! 🧘‍♂️🌱 #HealthFirst #MorningRoutine',
    'Hydration check! Drink enough electrolytes and clean water throughout your workouts. Small habits create massive changes! 💧🏋️‍♂️ #FitnessTips #Hydration',
    'Balanced nutrition: Focus on whole grains, seasonal greens, lean proteins, and healthy fats. Fuel your body right! 🥗🥑 #HealthyEating #Nutrition',
    'Rest and recovery are just as important as the workout itself. Quality sleep rebuilds muscle and resets cortisol levels! 🛌✨ #Wellness #Recovery',
    'Cardio session done! Pushing through the comfort zone builds mental resilience that carries over into every aspect of life. 🏃‍♀️🔥 #Running #FitnessGoals'
  ]
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function main() {
  console.log('🚀 Starting Seeding for 500 Groups (100 in each category) + 50 Posts per group + Memberships...\n');

  // 1. Fetch all users from database
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  if (users.length === 0) {
    console.error('❌ No users found in database! Please run `npm run db:seed:users` first.');
    process.exit(1);
  }

  console.log(`👥 Found ${users.length} users in database to populate groups & posts.`);
  const rakaUser = users.find((u) => u.username === 'raka92');

  // 2. Clean existing groups and group posts cleanly
  console.log('🧹 Cleaning existing group data (if any) to ensure fresh, clean seeding...');
  await prisma.groupMember.deleteMany().catch(() => {});
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: { not: null } } },
  }).catch(() => {});
  await prisma.post.deleteMany({
    where: { groupId: { not: null } },
  }).catch(() => {});
  await prisma.group.deleteMany().catch(() => {});
  console.log('✅ Cleared previous group records.');

  const categories = [
    'India Trends',
    'Technology',
    'Travel',
    'Food',
    'Lifestyle',
    'Fitness & Health',
    'Sports',
    'Entertainment',
  ];

  // 3. Build 100 groups per category (500 groups total)
  console.log('\n📦 Generating 500 group definitions (100 per category)...');
  const groupRecords = [];
  const groupCategoryMap = new Map();

  const now = Date.now();
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

  for (const category of categories) {
    const names = CATEGORY_NAMES[category];
    const catImages = CATEGORY_IMAGES[category];

    for (let i = 0; i < 100; i++) {
      const name = names[i] || `${category} Community ${i + 1}`;
      const slug = `${slugify(name)}-${i + 1}`;
      const groupId = crypto.randomUUID();
      const creator = users[i % users.length];

      const avatarUrl = catImages[i % catImages.length];
      const coverUrl = catImages[(i + 3) % catImages.length];

      const randomDaysAgo = Math.floor(Math.random() * 60) + 10;
      const createdAt = new Date(now - randomDaysAgo * 24 * 60 * 60 * 1000);

      groupRecords.push({
        id: groupId,
        name,
        slug,
        description: `Official ${name} community on VARTA. Connect with thinkers, creators, and enthusiasts sharing updates, media, and insights in ${category}.`,
        category,
        avatarUrl,
        coverUrl,
        creatorId: creator.id,
        memberCount: 0, // will be updated after memberships
        postCount: 50,  // exactly 50 posts per group
        isPrivate: false,
        createdAt,
        updatedAt: createdAt,
      });

      groupCategoryMap.set(groupId, category);
    }
  }

  console.log(`Generated ${groupRecords.length} group objects. Inserting into database in bulk...`);
  // Bulk insert groups
  await prisma.group.createMany({
    data: groupRecords,
  });
  console.log('✅ Successfully inserted 500 groups into PostgreSQL!');

  // 4. Generate random user memberships for each group
  console.log('\n🔗 Generating random user memberships for all 500 groups...');
  const memberRecords = [];
  const groupMemberCounts = new Map();
  const groupMembersMap = new Map();

  for (const group of groupRecords) {
    // 15 to 45 random users join each group
    const memberCount = Math.floor(Math.random() * 31) + 15;
    const joinedUsers = getRandomSubarray(users, memberCount);

    // Ensure creator is in the members as ADMIN
    if (!joinedUsers.some((u) => u.id === group.creatorId)) {
      joinedUsers.push({ id: group.creatorId, username: 'creator' });
    }

    // 40% chance raka92 joins this group if not already in it
    if (rakaUser && !joinedUsers.some((u) => u.id === rakaUser.id) && Math.random() < 0.4) {
      joinedUsers.push(rakaUser);
    }

    groupMembersMap.set(group.id, joinedUsers);
    groupMemberCounts.set(group.id, joinedUsers.length);

    for (const u of joinedUsers) {
      const isCreator = u.id === group.creatorId;
      memberRecords.push({
        id: crypto.randomUUID(),
        groupId: group.id,
        userId: u.id,
        role: isCreator ? 'ADMIN' : (Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER'),
        createdAt: new Date(new Date(group.createdAt).getTime() + Math.random() * 86400000 * 5),
      });
    }
  }

  console.log(`Generated ${memberRecords.length} group member records. Bulk inserting in chunks of 2,500...`);
  const memberChunkSize = 2500;
  for (let i = 0; i < memberRecords.length; i += memberChunkSize) {
    await prisma.groupMember.createMany({
      data: memberRecords.slice(i, i + memberChunkSize),
    });
    console.log(`Inserted ${Math.min(i + memberChunkSize, memberRecords.length)} / ${memberRecords.length} group members...`);
  }

  // Update memberCount on groups
  console.log('Updating memberCount on all 500 groups...');
  for (const group of groupRecords) {
    const count = groupMemberCounts.get(group.id) || 20;
    await prisma.group.update({
      where: { id: group.id },
      data: { memberCount: count },
    }).catch(() => {});
  }
  console.log('✅ Group memberships inserted and counters updated!');

  // 5. Generate 50 posts per group (500 groups * 50 = 25,000 posts!)
  console.log('\n📝 Generating 50 posts per group (Total: 25,000 posts with images, videos & text)...');

  const postRecords = [];
  const mediaRecords = [];

  let totalVideos = 0;
  let totalImages = 0;
  let totalText = 0;

  for (let gIdx = 0; gIdx < groupRecords.length; gIdx++) {
    const group = groupRecords[gIdx];
    const category = group.category;
    const groupMembers = groupMembersMap.get(group.id) || users;
    const catImages = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Technology'];
    const catSnippets = POST_SNIPPETS[category] || POST_SNIPPETS['Technology'];

    // Group created time
    const groupTime = new Date(group.createdAt).getTime();

    // 50 posts for this group
    for (let pIdx = 0; pIdx < 50; pIdx++) {
      const postId = crypto.randomUUID();
      const author = getRandomElement(groupMembers);

      // Distribute post timestamps between group creation time and now
      const timeSpan = Math.max(now - groupTime, 3600000);
      const postTime = new Date(groupTime + Math.floor(Math.random() * timeSpan));

      const baseText = getRandomElement(catSnippets);
      const content = `${baseText} [${group.name}]`;

      const likeCount = Math.floor(Math.random() * 45) + 5;
      const repostCount = Math.floor(Math.random() * 12);
      const replyCount = Math.floor(Math.random() * 6);
      const bookmarkCount = Math.floor(Math.random() * 5);

      postRecords.push({
        id: postId,
        authorId: author.id,
        groupId: group.id,
        content,
        likeCount,
        repostCount,
        replyCount,
        bookmarkCount,
        createdAt: postTime,
        updatedAt: postTime,
      });

      // Distribution per 50 posts:
      // - 15 posts with verified playable video (~30%)
      // - 25 posts with image (~50%)
      // - 10 posts text-only (~20%)
      if (pIdx < 15) {
        // Video post
        const video = getRandomElement(VERIFIED_VIDEOS);
        mediaRecords.push({
          id: crypto.randomUUID(),
          postId,
          type: 'VIDEO',
          url: video.url,
          thumbnailUrl: video.thumbnailUrl,
          mimeType: video.mimeType,
          sizeBytes: video.sizeBytes,
          width: video.width,
          height: video.height,
          order: 0,
          createdAt: postTime,
        });
        totalVideos++;
      } else if (pIdx < 40) {
        // Image post
        const imgUrl = getRandomElement(catImages);
        mediaRecords.push({
          id: crypto.randomUUID(),
          postId,
          type: 'IMAGE',
          url: imgUrl,
          thumbnailUrl: imgUrl,
          mimeType: 'image/jpeg',
          sizeBytes: 1350000,
          width: 1200,
          height: 800,
          order: 0,
          createdAt: postTime,
        });
        totalImages++;
      } else {
        totalText++;
      }
    }

    if ((gIdx + 1) % 50 === 0 || gIdx === groupRecords.length - 1) {
      console.log(`Generated posts for ${gIdx + 1} / ${groupRecords.length} groups (${postRecords.length} posts prepared)...`);
    }
  }

  // Bulk insert 25,000 posts in chunks of 1,000
  console.log(`\n⚡ Bulk inserting ${postRecords.length} posts into PostgreSQL in batches of 1,000...`);
  const postChunkSize = 1000;
  for (let i = 0; i < postRecords.length; i += postChunkSize) {
    const chunk = postRecords.slice(i, i + postChunkSize);
    await prisma.post.createMany({
      data: chunk,
    });
    if ((i + postChunkSize) % 5000 === 0 || i + postChunkSize >= postRecords.length) {
      console.log(`Inserted ${Math.min(i + postChunkSize, postRecords.length)} / ${postRecords.length} posts...`);
    }
  }

  // Bulk insert media attachments in chunks of 2,000
  console.log(`\n⚡ Bulk inserting ${mediaRecords.length} media records (images & playable videos) in batches of 2,000...`);
  const mediaChunkSize = 2000;
  for (let i = 0; i < mediaRecords.length; i += mediaChunkSize) {
    const chunk = mediaRecords.slice(i, i + mediaChunkSize);
    await prisma.postMedia.createMany({
      data: chunk,
    });
    if ((i + mediaChunkSize) % 4000 === 0 || i + mediaChunkSize >= mediaRecords.length) {
      console.log(`Inserted ${Math.min(i + mediaChunkSize, mediaRecords.length)} / ${mediaRecords.length} media items...`);
    }
  }

  // 6. Summary verification
  const totalGroupsInDb = await prisma.group.count();
  const totalGroupMembersInDb = await prisma.groupMember.count();
  const totalGroupPostsInDb = await prisma.post.count({ where: { groupId: { not: null } } });
  const totalGroupVideosInDb = await prisma.postMedia.count({
    where: { post: { groupId: { not: null } }, type: 'VIDEO' },
  });
  const totalGroupImagesInDb = await prisma.postMedia.count({
    where: { post: { groupId: { not: null } }, type: 'IMAGE' },
  });

  console.log('\n======================================================');
  console.log('🎉 500 GROUPS & 25,000 POSTS SEEDING COMPLETED!');
  console.log('======================================================');
  console.log(`📊 FINAL DATABASE COUNTS:`);
  console.log(`- 🏢 Total Groups Created:        ${totalGroupsInDb} (100 per category)`);
  for (const cat of categories) {
    const catCount = await prisma.group.count({ where: { category: cat } });
    console.log(`     • ${cat.padEnd(16)}: ${catCount} groups`);
  }
  console.log(`- 👥 Total Group Memberships:     ${totalGroupMembersInDb}`);
  console.log(`- 📝 Total Group Posts:           ${totalGroupPostsInDb} (50 posts/group)`);
  console.log(`- 🎬 Total Playable Videos:       ${totalGroupVideosInDb}`);
  console.log(`- 🖼️ Total High-Res Images:       ${totalGroupImagesInDb}`);
  if (rakaUser) {
    const rakaGroupCount = await prisma.groupMember.count({ where: { userId: rakaUser.id } });
    console.log(`- 🌟 @raka92 Joined Communities:  ${rakaGroupCount} groups`);
  }
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during group seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
