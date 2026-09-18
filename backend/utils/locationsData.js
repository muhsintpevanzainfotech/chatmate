// Comprehensive location dataset with hierarchical Country -> State -> District/Place mapping
export const locations = {
  India: {
    "Kerala": [
      "Malappuram", "Kozhikode", "Ernakulam", "Thiruvananthapuram", "Thrissur",
      "Kollam", "Kannur", "Kottayam", "Palakkad", "Alappuzha", "Idukki",
      "Wayanad", "Kasaragod", "Pathanamthitta"
    ],
    "Tamil Nadu": [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
      "Tirunelveli", "Erode", "Vellore", "Thanjavur", "Tuticorin",
      "Kanchipuram", "Kanyakumari", "Dindigul", "Cuddalore"
    ],
    "Karnataka": [
      "Bengaluru Urban", "Mysuru", "Mangaluru (Dakshina Kannada)", "Hubballi-Dharwad",
      "Belagavi", "Kalaburagi", "Shivamogga", "Tumakuru", "Udupi", "Ballari"
    ],
    "Maharashtra": [
      "Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik",
      "Aurangabad (Chhatrapati Sambhaji Nagar)", "Solapur", "Kolhapur", "Navi Mumbai"
    ],
    "Delhi NCR": [
      "New Delhi", "Central Delhi", "South Delhi", "North Delhi", "East Delhi",
      "West Delhi", "Gurugram", "Noida", "Faridabad", "Ghaziabad"
    ],
    "Telangana": [
      "Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Warangal", "Nizamabad", "Karimnagar"
    ],
    "Andhra Pradesh": [
      "Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kakinada", "Kurnool"
    ],
    "West Bengal": [
      "Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Darjeeling", "Siliguri"
    ],
    "Gujarat": [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar"
    ],
    "Punjab": [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "SAS Nagar (Mohali)"
    ],
    "Rajasthan": [
      "Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"
    ],
    "Uttar Pradesh": [
      "Lucknow", "Kanpur", "Varanasi", "Agra", "Ghaziabad", "Noida", "Prayagraj"
    ],
    "Goa": [
      "North Goa (Panaji)", "South Goa (Margao)"
    ],
    "Assam": [
      "Guwahati (Kamrup)", "Silchar", "Dibrugarh", "Jorhat"
    ],
    "Bihar": [
      "Patna", "Gaya", "Muzaffarpur", "Bhagalpur"
    ],
    "Odisha": [
      "Bhubaneswar", "Cuttack", "Rourkela", "Puri"
    ],
    "Madhya Pradesh": [
      "Bhopal", "Indore", "Gwalior", "Jabalpur"
    ],
    "Haryana": [
      "Gurugram", "Faridabad", "Panchkula", "Ambala"
    ],
    "Himachal Pradesh": [
      "Shimla", "Manali (Kullu)", "Dharamshala (Kangra)", "Solan"
    ],
    "Uttarakhand": [
      "Dehradun", "Haridwar", "Nainital", "Rishikesh"
    ],
    "Jammu & Kashmir": [
      "Srinagar", "Jammu", "Anantnag"
    ]
  },
  "United States": {
    "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose"],
    "New York": ["New York City", "Buffalo", "Rochester", "Albany"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"]
  },
  "United Kingdom": {
    "England": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
    "Scotland": ["Edinburgh", "Glasgow", "Aberdeen"]
  },
  "Canada": {
    "Ontario": ["Toronto", "Ottawa", "Hamilton"],
    "British Columbia": ["Vancouver", "Victoria"]
  },
  "United Arab Emirates": {
    "Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"]
  }
};

export const getCountries = () => Object.keys(locations);
export const getStates = (country) => (locations[country] ? Object.keys(locations[country]) : []);
export const getDistricts = (country, state) => (locations[country]?.[state] || []);
