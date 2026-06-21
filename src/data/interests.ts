export type InterestCategory = { name: string; tags: string[] }

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    name: 'Music',
    tags: [
      'Gospel music', 'Music bands', 'Rock music', 'Soul music', 'Pop music',
      'K-Pop', 'Punk rock', 'Jazz', 'House music', 'EDM', 'R&B', 'Opera',
      'Indie music', 'Alternative music', 'Techno', 'Folk music', 'Latin music',
      'Rap music', 'Heavy Metal', 'Funk music', 'Grime', '90s Britpop',
      'Hip Hop', 'J-Pop', 'Reggaeton', 'Country Music', 'Electronic Music',
      'Trap Music', 'Afrobeats', 'Lo-fi', 'Dancehall',
    ],
  },
  {
    name: 'Food and drink',
    tags: [
      'Foodie', 'Food tours', 'Street Food', 'Plant-based', 'Boba tea',
      'Sweet treats', 'Mocktails', 'Brunch', 'Sushi', 'Cocktails', 'Ice Cream',
      'Coffee', 'Ramen', 'Korean Food', 'BBQ', 'Craft Beer', 'Tea', 'Pho',
      'Wine', 'Açaí', 'Tacos', 'Vegan', 'Pasta', 'Dim Sum', 'Desserts',
    ],
  },
  {
    name: 'Gaming',
    tags: [
      'E-Sports', 'PlayStation', 'Fortnite', 'Among Us', 'Atari', 'Xbox',
      'League of Legends', 'Nintendo', 'Roblox', 'PC Gaming', 'Minecraft',
      'Call of Duty', 'Valorant', 'FIFA', 'RPGs', 'Indie Games', 'VR Gaming',
      'Retro Gaming', 'Mobile Gaming', 'Chess',
    ],
  },
  {
    name: 'Going out',
    tags: [
      'Escape Rooms', 'Bars', 'Thrifting', 'Museums', 'Raves', 'Drive-in Cinema',
      'Musical theater', 'Aquarium', 'Cars', 'Exhibition', 'Shopping',
      'House Parties', 'Theater', 'Pub Quiz', 'Festivals', 'Bowling',
      'Motorcycles', 'Film Festival', 'Shisha', 'Happy hour', 'Stand up Comedy',
      'Karaoke', 'Nightlife', 'Art galleries', 'Live Music', 'Bar Hopping',
      'Parties', 'Pubs', 'Rollerskating', 'Concerts', 'Town Festivities',
      'Cafe hopping', 'Clubbing',
    ],
  },
  {
    name: 'Creativity',
    tags: [
      'Freelancing', 'Photography', 'Language Exchange', 'Cosplay',
      'Content Creation', 'Tattoos', 'Painting', 'Entrepreneurship', 'Dancing',
      'Singing', 'Investing', 'Choir', 'Vintage fashion', 'Poetry', 'Acapella',
      'Musical Instrument', 'Musical Writing', 'Writing', 'Literature', 'NFTs',
      'Exchange Program', 'Art', 'Real Estate', 'Drawing', 'Fashion', 'DIY',
      'Upcycling', 'Sneakers', 'Blogging', 'Graphic Design', 'Film Making',
      'Pottery', '3D Printing',
    ],
  },
  {
    name: 'Fan favorites',
    tags: [
      'Comic-con', 'Harry Potter', '90s Kid', 'NBA', 'MLB', 'Manga', 'Marvel',
      'Dungeons & Dragons', 'Disney', 'Star Wars', 'Lord of the Rings',
      'Formula 1', 'K-Pop Stans', 'True Crime', 'Podcast Junkie', 'Anime Fan',
      'Memes', 'TikTok',
    ],
  },
  {
    name: 'Wellness and lifestyle',
    tags: [
      'Self Love', 'Trying New Things', 'Spa', 'Self Care', 'Meditation',
      'Tarot', 'Astrology', 'Skincare', 'Self Development', 'Mindfulness',
      'Makeup', 'Sauna', 'Active Lifestyle', 'Yoga', 'Journaling', 'Therapy',
      'Breathwork', 'Pilates', 'Morning Routines', 'Clean Living',
    ],
  },
  {
    name: 'Sports and fitness',
    tags: [
      'Ice Hockey', 'Sports Shooting', 'Athletics', 'Walking', 'Skating',
      'Beach sports', 'Fitness classes', 'Sports', 'Gymnastics', 'Hockey',
      'Basketball', 'Running', 'Rugby', 'Boxing', 'Pole Dancing', 'Car Racing',
      'Motor Sports', 'Padel', 'Equestrian', 'Soccer', 'Gym', 'Cricket',
      'Skateboarding', 'Football', 'Tennis', 'Cheerleading', 'Jogging',
      'Archery', 'Crossfit', 'Weightlifting', 'Wrestling', 'Marathon',
      'Martial Arts', 'Volleyball', 'Climbing', 'Cycling', 'Swimming',
      'Table Tennis', 'Working out', 'Baseball', 'Badminton', 'Kickboxing',
      'MMA', 'Muay Thai',
    ],
  },
  {
    name: 'Staying in',
    tags: [
      'Reading', 'Home Workout', 'Binge-Watching TV shows', 'Cooking',
      'Gardening', 'Online Games', 'Online Shopping', 'Board Games', 'Trivia',
      'Baking', 'Puzzle Games', 'Journaling', 'Candle Making', 'Knitting',
      'ASMR', 'Meditation', 'Vinyl Collecting',
    ],
  },
  {
    name: 'TV and movies',
    tags: [
      'Action movies', 'Animated movies', 'Crime shows', 'Fantasy movies',
      'Documentaries', 'Drama shows', 'Rom-coms', 'Sports shows',
      'Thriller films', 'K-drama shows', 'Indie films', 'Reality TV', 'Movies',
      'Horror Movies', 'Sci-Fi', 'Bollywood', 'Anime', 'Comedy',
      'Stand-up Specials', 'True Crime Docs', 'Sitcoms', 'Mini-series',
    ],
  },
  {
    name: 'Values and causes',
    tags: [
      'Equality', 'Social Development', 'Human Rights', 'LGBTQIA+ Rights',
      'Feminism', 'Black Lives Matter', 'Inclusivity', 'Voter Rights',
      'Climate Change', 'World Peace', 'Pride', 'Youth Empowerment', 'Politics',
      'Activism', 'Disability Rights', 'Volunteering', 'Environmentalism',
      'Mental Health Awareness', 'Animal Rights', 'Education Reform',
      'Free Speech', 'Community Building',
    ],
  },
  {
    name: 'Outdoors and adventure',
    tags: [
      'Diving', 'Jetskiing', 'Nature', 'Walking tours', 'Rowing',
      'Walking My Dog', 'Travel', 'Paddle Boarding', 'Surfing', 'Beach Bars',
      'Paragliding', 'Skiing', 'Snowboarding', 'Road Trips', 'Couchsurfing',
      'Free Diving', 'Sailing', 'Hiking', 'Mountains', 'Fishing',
      'Rock Climbing', 'Camping', 'Picnicking', 'Outdoors', 'Canoeing',
      'Backpacking', 'Hot Springs', 'Kayaking', 'Trail Running',
      'Wildlife Watching',
    ],
  },
  {
    name: 'Pets and animals',
    tags: [
      'Dog lover', 'Cat lover', 'Horse riding', 'Bird watching', 'Reptiles',
      'Aquariums', 'Pet adoption', 'Animal rescue', 'Farm animals', 'Hamsters',
      'Fish keeping',
    ],
  },
  {
    name: 'Languages and culture',
    tags: [
      'Learning languages', 'Bilingual', 'Cultural exchange', 'History',
      'Philosophy', 'World cuisine', 'Traditions', 'International music',
      'Documentary lover', 'Anthropology',
    ],
  },
]

export const ALL_INTERESTS = INTEREST_CATEGORIES.flatMap(c => c.tags)
