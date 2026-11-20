// Demo data, so the map and the lists are not empty during the demo:
// 71 places in 24 towns of Lebanon (each one with its own venue account, a cover photo
// and a photo of one of its criteria), so every category has places with each criterion,
// 8 visitors who leave reviews (2 to 4 per place, some answered by the owner), 6 equipment suppliers with 25 listings
// from Tripoli to Saida (each with a photo and its position, for "Near me"), and 10 requests.
// The business names are made up on purpose (no fake reviews about real businesses),
// but the towns and the street photos are real.
// Photos: Wikimedia Commons, free licenses, credits in the README. No photo is used twice.
//
// Every demo account has an email ending in @demo.accesspath.lb and the password demo1234.
// Running the script again first deletes the old demo data, so it never doubles.
//   on your computer:  node scripts/seed.js
//   on Atlas:          MONGODB_URI="mongodb+srv://..." node scripts/seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Place } from '../models/Place.js';
import { Review } from '../models/Review.js';
import { Listing } from '../models/Listing.js';
import { Request } from '../models/Request.js';

const DOMAIN = '@demo.accesspath.lb';
const PASSWORD = 'demo1234';

// Each place: name, category, address, lat, lng,
// its 4 criteria [step-free, elevator, toilets, parking],
// a photo of its street (the cover), then which criterion the second photo shows
// and that photo (the ramp or the steps at the door, the elevator, the toilets or the parking).
// The second photo goes in accessPhotos, so the place page shows it next to its criterion.
const PLACES = [
  // Beirut
  ['Hotel Cedar Bay', 'hotel', 'Ain el Mreisseh, Beirut', 33.9002, 35.4878,
    [true, true, true, true], 'Another rainy Beirut day.jpg', 'elevator', '3 elevators.jpg'],
  ['Hamra Fresh Market', 'supermarket', 'Hamra Street, Beirut', 33.8968, 35.483,
    [true, false, false, false], 'Hamra Street, Beirut (1).jpg', 'stepFree', 'Entrance with ramp (5866504842).jpg'],
  ['Hamra Corner Books', 'shop', 'Hamra, Beirut', 33.896, 35.4815,
    [true, false, false, false], 'Rue Hamra Sign.jpg', 'stepFree', 'SSF Main Library wheelchair ramp 1.JPG'],
  ['Verdun Garden Cafe', 'cafe', 'Verdun, Beirut', 33.8865, 35.485,
    [true, false, true, true], 'Verdun beirut.jpg', 'parking', 'Diagonal handicapped parking space (18463401242).jpg'],
  ['Chez Vasken', 'cafe', 'Gouraud Street, Gemmayzeh, Beirut', 33.8952, 35.5153,
    [false, false, false, false], 'Gemmayzeh (4694185351).jpg',
    'stepFree', 'Lyttelton House Gallery, Priory Steps, Malvern - geograph.org.uk - 1305094.jpg'],
  ['Sioufi Garden Cafe', 'cafe', 'Sioufi, Achrafieh, Beirut', 33.8868, 35.5262,
    [true, false, true, false], 'Sioufi Garden Achrafieh District 01.jpg',
    'toilets', 'Accessible toilet Platform 10 Roma Street Station Brisbane P1110354.jpg'],
  ['Achrafieh Savings Bank', 'bank', 'Achrafieh, Beirut', 33.8887, 35.5205,
    [true, true, false, false], 'Zahrat al Ihsan Street, Achrafieh, Beirut.jpg',
    'elevator', 'Destination control elevator interior 2.jpg'],
  ['Achrafieh Medical Center', 'hospital', 'Achrafieh, Beirut', 33.8835, 35.5235,
    [true, true, true, true], 'Achrafieh.jpg',
    'elevator', 'Interior of a vintage Montgomery elevator with a modified controller.jpg'],
  ['Zaitunay Bay Seafood', 'restaurant', 'Zaitunay Bay, Beirut', 33.9015, 35.4955,
    [true, true, true, true], 'Zaitunay Bay (1).jpg', 'elevator',
    'Hakata Bus Terminal the interior of the elevator passing through the 5th floor Hakata-eki-chūōgai Hakata-ku Fukuoka 20240806.jpg'],
  ['Saifi Corner Cafe', 'cafe', 'Saifi Village, Beirut', 33.8955, 35.51,
    [true, true, true, false], 'Beirut 002.jpg', 'elevator', 'Lift doors at Tyntesfield.jpg'],
  ['Badaro Kitchen', 'restaurant', 'Badaro Street, Beirut', 33.8745, 35.515,
    [true, true, true, false], 'Badaro nightlife.jpeg', 'toilets',
    'Accessible toilet Cherry Street Sports Club 68 Cherry St Ballina NSW L1010056.jpg'],
  ['Corniche Sunset Cafe', 'cafe', 'Corniche, Ras Beirut', 33.8995, 35.472,
    [true, true, true, true], 'Corniche Beirut at sunset, seaside promenade, Beirut, Lebanon.jpg', 'parking',
    'Blue Disc Parking Area Markings Blue Paint.JPG'],
  ['Manara Rooftop Cafe', 'cafe', 'Manara, Beirut', 33.901, 35.469,
    [true, true, true, false], 'The Corniche Beirut, Beirut, Lebanon.jpg', 'elevator',
    'Interior of Panoramic VEK Elevator in Beton Brut Hotel (Anapa).jpg'],
  ['Downtown City Market', 'supermarket', 'Downtown, Beirut', 33.896, 35.505,
    [true, true, true, true], 'Downtown Beirut.jpg', 'elevator',
    'Fukuoka Airport Domestic Passenger Terminal Bldg The elevators in the atrium Hakata-ku Fukuoka 20250304 152738.jpg'],
  ['Saifi Concept Store', 'shop', 'Saifi, Beirut', 33.895, 35.5085,
    [true, true, true, true], 'Passing Beirut.jpg', 'toilets', 'A closer view of the accessible toilet on the VIA Rail.jpg'],
  ['Vasken Electronics', 'shop', 'Bliss Street, Ras Beirut', 33.8975, 35.479,
    [true, true, false, true], 'Ras Beirut District (3).jpg', 'elevator',
    'Red lift doors on platform 1, Bridgend railway station - geograph.org.uk - 6707903.jpg'],
  ['Monot Pharmacy', 'pharmacy', 'Rue Monot, Achrafieh, Beirut', 33.8905, 35.513,
    [true, true, true, true], 'Rue Monot.jpg', 'toilets',
    'Accessible toilet Platforms 2&3 Rocklea Railway Station, Brooke Street, Rocklea P1120352.jpg'],
  ['Corniche Rehabilitation Hospital', 'hospital', 'Corniche, Ras Beirut', 33.8985, 35.476,
    [true, true, true, true], 'Beirut Corniche from University Tower.jpg', 'elevator', 'Elevators at point A2 - NÄL hospital 1.jpg'],
  ['Waterfront Bank', 'bank', 'Beirut Central District', 33.9, 35.501,
    [true, true, false, true], 'Beirut Central District, Beirut, Lebanon - panoramio.jpg', 'parking',
    'RDW disabled parking sign, Veendam (2020) 01.jpg'],
  ['Beirut Municipal Service Center', 'government', 'Downtown, Beirut', 33.894, 35.503,
    [true, true, true, false], 'BeirutCentralDistrict.jpg', 'elevator', 'Dover elevator passenger controls (3 floors).jpg'],
  ['Beirut Technical Institute', 'university', 'Achrafieh, Beirut', 33.8855, 35.5215,
    [true, true, true, true], 'Beirut skyline.jpg', 'elevator',
    'Lift doors, Port Talbot Parkway station - geograph.org.uk - 7728730.jpg'],
  ['Achrafieh Public Library', 'other', 'Sassine, Achrafieh, Beirut', 33.8875, 35.5225,
    [true, true, true, true], 'Beirut skylines 2019.jpg', 'stepFree',
    'Wheelchair ramp up to the cathedral entrance, Coventry – start of the handrail - geograph.org.uk - 5028944.jpg'],

  // Bourj Hammoud
  ["Vasken's Bakery", 'restaurant', 'Armenia Street, Bourj Hammoud', 33.8925, 35.5425,
    [true, false, false, false], 'Beirut Bourj Hammoud - 2018 - 08.jpg', 'stepFree', 'Accessible entrance at UCMS.jpg'],
  ['Sarkis Market', 'supermarket', 'Arax Street, Bourj Hammoud', 33.8908, 35.5397,
    [true, false, true, true], 'Beirut Bourj Hammoud - 2018 - 11.jpg', 'parking', 'Disabled Parking Space in Málaga.jpg'],
  ["Vasken's Pharmacy", 'pharmacy', 'Marash Street, Bourj Hammoud', 33.893, 35.541,
    [true, false, false, true], 'Beirut Bourj Hammoud - 2018 - 12.jpg', 'stepFree', 'Wheelchair ramp sign .jpg'],
  ['Vasken Hardware', 'shop', 'Arax Street, Bourj Hammoud', 33.8902, 35.539,
    [false, false, false, false], 'Beirut Bourj Hammoud - 2018 - 07.jpg', 'stepFree', 'Old steps - geograph.org.uk - 415706.jpg'],
  ['Vasken Toys and Gifts', 'shop', 'Armenia Street, Bourj Hammoud', 33.8918, 35.544,
    [true, false, false, false], 'Beirut Bourj Hammoud - 2018 - 10.jpg',
    'stepFree', '7-Eleven Dongji Store wheelchair ramp 20221020.jpg'],

  // Mount Lebanon
  ["Vasken's Sweets", 'restaurant', 'Main road, Antelias', 33.9145, 35.5875,
    [true, false, true, true], 'Antelias Mar Elias.JPG', 'parking', 'Disabled Parking Space in Virreina Neighbourhood.jpg'],
  ['Vasken Grand Hotel', 'hotel', 'Main road, Broummana', 33.881, 35.6215,
    [true, true, true, true], 'Broumana From Hazmieh, Lebanon.jpg',
    'elevator', 'Schindler 330A hydraulic elevator interior with cascading doors.jpg'],
  ['Beit Mery Vine Terrace', 'restaurant', 'Beit Mery', 33.856, 35.5995,
    [true, false, true, true], 'Beit Meri - Grapevine on Balcony (2318594652).jpg',
    'toilets', 'Accessible toiletblock with ramp and handrail (6253938166).jpg'],
  ['Aley Hillside Pharmacy', 'pharmacy', 'Main street, Aley', 33.8095, 35.5995,
    [true, false, false, false], 'Aley Lebanon Houses and hillside.jpg',
    'stepFree', 'Entrance ramp on Market Place, Candler Building (1912; renovated 1990), 101-125 Market Place, Baltimore, MD 21202.jpg'],
  ['Deir el Qamar Square Cafe', 'cafe', 'Main square, Deir el Qamar', 33.6965, 35.5615,
    [false, false, false, false], 'Deir El-Qamar 02.jpg', 'stepFree', 'Entrance to Heatherslaw Mill Shop - geograph.org.uk - 1555460.jpg'],
  ['Jounieh Bay Hotel', 'hotel', 'Seaside road, Jounieh', 33.9808, 35.6178,
    [true, true, true, false], 'Bayofjouniehviewfromrabieh2.JPG', 'toilets', 'Handicap toilet 2.jpg'],
  ['Kaslik Shoe Gallery', 'shop', 'Kaslik, Jounieh', 33.9695, 35.6125,
    [false, false, false, false], '3133 (8)jounieh.JPG', 'stepFree', 'Bibliotheque Saint-Sulpice 12.JPG'],
  ['Jounieh Marina Resort', 'hotel', 'Seaside, Jounieh', 33.976, 35.615,
    [true, true, true, false], 'Jounieh 2.jpg', 'toilets', 'Disabled accessible toilet Haringey.jpg'],
  ['Faraya Snow Lodge', 'hotel', 'Main road, Faraya', 33.979, 35.8195,
    [true, false, true, true], 'The village of faraya.jpg', 'parking', 'Handicap Parking Space (32283094777).jpg'],
  ['Dbayeh Hypermarket', 'supermarket', 'Highway, Dbayeh', 33.938, 35.588,
    [true, true, true, true], 'Lebanon- Dbayeh Highway.jpg', 'parking', 'French Disabled Parking Space Sign.jpg'],

  // North
  ['Sea Gate Grill', 'restaurant', 'Seaside, Byblos', 34.121, 35.646,
    [true, false, true, true], 'Beach in Byblos.JPG', 'parking', 'Disabled Parking in Gibralfaro.jpg'],
  ['Byblos Souk Crafts', 'shop', 'Old souk, Byblos', 34.1208, 35.6478,
    [false, false, false, false], 'ByblosOldSouk.jpg', 'stepFree', 'Steps at the entrance to Grand Central - geograph.org.uk - 4693180.jpg'],
  ['Souk Lantern Restaurant', 'restaurant', 'Old souk, Byblos', 34.1214, 35.6484,
    [true, false, true, false], 'ByblosSoukNight.jpg', 'toilets', 'Charlecote Park disabled toilet Warwickshire England.jpg'],
  ['Batroun Lemonade House', 'cafe', 'Old town, Batroun', 34.2553, 35.6588,
    [true, false, false, false], 'Batroun - Old Street (2308265587).jpg', 'stepFree', 'Access Ramp 1.JPG'],
  ['Phoenician Wall Guesthouse', 'hotel', 'Seaside, Batroun', 34.2565, 35.6555,
    [false, false, false, false], 'Arches and the natural sea wall of the old city (2308265699).jpg',
    'stepFree', 'An old dorway with steps - geograph.org.uk - 254063.jpg'],
  ['Batroun Harbour Fish House', 'restaurant', 'Old port, Batroun', 34.255, 35.6585,
    [true, false, true, true], 'Batroun port IMG 1038.jpg', 'parking', 'On-street parallel handicapped parking space (18521571846).jpg'],
  ['Tripoli Sweets Corner', 'restaurant', 'Old city, Tripoli', 34.4367, 35.8497,
    [false, false, false, true], "'Sour' dough (5348283264).jpg",
    'stepFree', 'Abraham J. Friedlander House, Cincinnati, OH (46438201195).jpg'],
  ['Tripoli Old Souk Pharmacy', 'pharmacy', 'Old souks, Tripoli', 34.4345, 35.844,
    [true, false, false, false], 'Historical districts, streets of Tripoli, Lebanon.jpg', 'stepFree', 'Accessible entrance.jpg'],
  ['Tripoli Downtown Institute', 'university', 'Downtown, Tripoli', 34.437, 35.835,
    [true, true, true, true], 'Downtown Tripoli, old buildings, Tripoli, Lebanon.jpg',
    'elevator', 'ThyssenKrupp wheelchair lift in Moscow 01.jpg'],
  ['Zgharta Main Road Market', 'supermarket', 'Main road, Zgharta', 34.397, 35.895,
    [true, false, false, true], 'La route principale à Zghorta.jpg', 'parking', 'B5 Johor Street Market - Disabled Parking.jpg'],
  ['Ehden Pine Hotel', 'hotel', 'Main square, Ehden', 34.2915, 35.9935,
    [true, true, true, false], 'Vue de Ehden et du Mont-Liban.JPG', 'elevator', 'Lift doors - geograph.org.uk - 5562733.jpg'],
  ['Bsharri Square Cafe', 'cafe', 'Main square, Bsharri', 34.251, 36.011,
    [true, false, false, false], 'Bsharri church and main square with a statue of angel, Bsharri, Lebanon.jpg',
    'stepFree', 'Hull Maritime Museum New Wheelchair Ramp, Kingston upon Hull Jun24.jpg'],
  ['Byblos Garden Cafe', 'cafe', 'Near the old town, Byblos', 34.119, 35.646,
    [true, false, true, true], 'The city of Byblos, Lebanon.jpg', 'parking',
    'Provisional disabled parking sign, Molenlaankwartier, Rotterdam (2021) 02.jpg'],
  ['Byblos Arcade Gift Shop', 'shop', 'Old souk, Byblos', 34.1212, 35.6472,
    [true, false, true, false], 'Byblos historic quarter, Byblos, Lebanon.jpg', 'toilets',
    'Accessible outdoor public toilet Botanic Gardens Aarhus.jpg'],
  ['Vasken Supermarket', 'supermarket', 'Main road, Jbeil', 34.123, 35.652,
    [true, true, true, true], 'Byblos - Jbeil City (2308966694).jpg', 'elevator', 'Lift doors - geograph.org.uk - 7367152.jpg'],
  ['El Mina Seaside Restaurant', 'restaurant', 'Seafront, El Mina, Tripoli', 34.45, 35.82,
    [true, true, true, true], 'Mina-Tripoli-1.jpg', 'parking',
    'Michelangelostraat disabled parking sign, Prinsenland, Rotterdam (2022) 01.jpg'],
  ['Halba Municipality', 'government', 'Municipality square, Halba', 34.543, 36.08,
    [true, false, true, true], 'ساحة بلدية حلبا.jpg', 'toilets', 'Accessible toilet in CR400BF-0503 (20170307102356).jpg'],
  ['Halba Central Pharmacy', 'pharmacy', 'Town center, Halba', 34.544, 36.079,
    [true, true, false, true], 'وسط حلبا.jpg', 'elevator', 'Elevator Call Button.jpg'],

  // Bekaa
  ['Berdawni River Terrace', 'restaurant', 'Berdawni, Zahle', 33.853, 35.902,
    [true, false, true, true], 'Berdawnicafe.jpg', 'toilets', 'Accessible toilet in Japan.JPG'],
  ['Zahle Family Market', 'supermarket', 'Main street, Zahle', 33.8463, 35.902,
    [true, false, true, true], 'Zahle,Lebanon.JPG', 'parking', 'Disabled Parking Spaces in Seminario.jpg'],
  ["Vasken's Grill", 'restaurant', 'Main street, Anjar', 33.7275, 35.9325,
    [true, false, true, true], 'Anjar Street, March 2017.jpg',
    'toilets', 'Accessible toilet at Majiapu Station (20181231133605).jpg'],
  ['Temple View Guesthouse', 'hotel', 'Near the temples, Baalbek', 34.0055, 36.2085,
    [false, false, false, true], 'Temple of Jupiter, Baalbek, Lebanon (5073942385).jpg',
    'parking', 'Handicapped parking space outside of the Combi, Aschendorf (2017).jpg'],
  ['Rashaya Old Souk Cafe', 'cafe', 'Old souk, Rashaya', 33.4985, 35.843,
    [false, false, true, false], 'Rashaya.jpg', 'toilets', 'Toilet for disabled people with wheelchairs.jpg'],
  ['Zahle Plaza Bank', 'bank', 'Main street, Zahle', 33.848, 35.904,
    [true, true, true, true], 'Zahlé pano.jpg', 'elevator', 'Chrysler Central Elevator 2019-10-03 20-18.jpg'],

  // South
  ['Old Souk Pharmacy', 'pharmacy', 'Old city, Saida', 33.563, 35.37,
    [true, false, false, false], 'Streets of Sidon, Lebanon.jpg', 'stepFree', 'Accès pour handicapés 01.jpg'],
  ['Old Saida Coffee House', 'cafe', 'Old city, Saida', 33.5628, 35.3712,
    [false, false, false, false], 'Old city of Sidon, Lebanon.jpg', 'stepFree', "Ataman's district building (entrance).jpg"],
  ['Sea Castle Fish Restaurant', 'restaurant', 'Seafront, Saida', 33.5665, 35.373,
    [true, false, true, true], 'Sidon Sea Castle, Sidon, Lebanon.jpg',
    'toilets', 'Changing Places Accessible Toilet for Disabled Inclusion.jpg'],
  ['Saida Soap Shop', 'shop', 'Old souks, Saida', 33.5612, 35.3718,
    [true, false, false, false], 'Alleyways, Old city of Sidon, Lebanon.jpg', 'stepFree', 'Handrails in the ramp for wheelchair users.jpg'],
  ['Jezzine Falls Restaurant', 'restaurant', 'Near the waterfall, Jezzine', 33.544, 35.585,
    [true, false, true, true], 'Jezzine 3.JPG', 'toilets', 'Accessible toilet Brisbane Airport Domestic Terminal IMGP5513.jpg'],
  ['Tyre Family Market', 'supermarket', 'Main road, Tyre', 33.2705, 35.196,
    [true, false, true, true], 'City Road 01.JPG', 'toilets', 'Accessible toilet.jpg'],
  ['Old Port Rooms', 'hotel', 'Christian quarter, Tyre', 33.2745, 35.1945,
    [true, true, true, false], 'TyreNarrowStChrQrt.jpg', 'elevator', 'Analysing elevator control buttons (7771545062).jpg'],
  ['Al Mina Ruins Cafe', 'cafe', 'Al Mina, Tyre', 33.268, 35.1965,
    [true, false, false, false], 'Remains of ancient columns at Al Mina excavation site, Tyre, Lebanon.jpg',
    'stepFree', 'Steps, handrail and ramp, Gate No.2 - geograph.org.uk - 2613734.jpg'],
  ['Saida Seafront Hospital', 'hospital', 'New city, Saida', 33.56, 35.38,
    [true, true, true, true], 'SidonNewCity.jpg', 'elevator', 'Elevator at Vestfold Hospital 2.jpg'],
  ['Old Saida Arches Restaurant', 'restaurant', 'Old city, Saida', 33.5625, 35.372,
    [true, false, true, false], 'Old city, Sidon, Lebanon.jpg', 'stepFree',
    'Disabled ramp to Caernarfon Castle - geograph.org.uk - 1280693.jpg'],
];

const commonsUrl = (file) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`;

const VISITORS = ['Rana', 'Marc', 'Nour', 'Karim', 'Maya', 'Elie', 'Lara', 'Hadi'];

// place name, visitor name, rating, comment (a visitor reviews a place only once)
const REVIEWS = [
  ['Hotel Cedar Bay', 'Rana', 5, 'Ramp at the main door and a large elevator. The staff helped me with my bags without me asking.'],
  ['Hotel Cedar Bay', 'Marc', 4, 'Everything is accessible. The parking spots are a bit far from the entrance.'],
  ['Hotel Cedar Bay', 'Maya', 5, 'We booked the accessible room: roll-in shower and space on both sides of the bed.'],
  ['Hotel Cedar Bay', 'Hadi', 4, 'Good hotel. The terrace door is heavy, but someone always opens it.'],

  ['Hamra Fresh Market', 'Nour', 4, 'Automatic doors and no step, easy with the stroller. The aisles get narrow near the cashiers.'],
  ['Hamra Fresh Market', 'Karim', 3, 'The ramp at the entrance is fine, but no toilet and no parking. I came by taxi.'],
  ['Hamra Fresh Market', 'Elie', 4, 'My grandmother goes in with her walker without any problem.'],

  ['Hamra Corner Books', 'Hadi', 4, 'Ramp at the door. The shelves at the back are close together, so I ask for help there.'],
  ['Hamra Corner Books', 'Nour', 5, 'The kids corner is on the ground floor, easy with the stroller.'],
  ['Hamra Corner Books', 'Karim', 4, 'Good choice of French and Arabic books, and the entrance is flat.'],

  ['Verdun Garden Cafe', 'Maya', 4, 'The terrace is at street level and there is an accessible toilet inside.'],
  ['Verdun Garden Cafe', 'Marc', 5, 'Reserved parking right in front, my father goes straight in.'],
  ['Verdun Garden Cafe', 'Lara', 4, 'Nice for brunch with the baby, a bit noisy on Saturdays.'],

  ['Chez Vasken', 'Hadi', 2, 'Great coffee, but one big step and the tables are too close. Vasken brought my coffee out to the sidewalk.'],
  ['Chez Vasken', 'Lara', 3, 'Small cafe on a busy street. I had to leave the stroller outside.'],
  ['Chez Vasken', 'Rana', 2, 'The step at the door is too high to get in without help.'],

  ['Sioufi Garden Cafe', 'Maya', 5, 'Right next to the garden, no step and a real accessible toilet.'],
  ['Sioufi Garden Cafe', 'Elie', 4, 'Quiet and shaded, easy with a walker. Finding parking in Sioufi is another story.'],
  ['Sioufi Garden Cafe', 'Karim', 4, 'Good place to sit after a walk in the garden.'],

  ['Achrafieh Savings Bank', 'Rana', 4, 'Ramp and an elevator to the first floor, and the ATM is low enough for me.'],
  ['Achrafieh Savings Bank', 'Marc', 3, "The elevator is small, my father's wheelchair just fits."],
  ['Achrafieh Savings Bank', 'Elie', 3, 'No toilet for clients and nowhere to park.'],

  ['Achrafieh Medical Center', 'Rana', 5, 'Everything is accessible, from the parking to the X-ray room.'],
  ['Achrafieh Medical Center', 'Elie', 5, 'Wheelchairs are available for free at the entrance.'],
  ['Achrafieh Medical Center', 'Karim', 4, 'Long wait at the emergency, but the building is easy to move around in.'],
  ['Achrafieh Medical Center', 'Hadi', 4, 'Large elevators and accessible toilets on every floor.'],

  ["Vasken's Bakery", 'Rana', 5, 'No step at the door and the best manakish in Bourj Hammoud. Ask for the cheese one.'],
  ["Vasken's Bakery", 'Nour', 4, 'Easy to get in with a stroller. Small inside, so it gets crowded at lunch time.'],
  ["Vasken's Bakery", 'Hadi', 5, 'The first time, Vasken came out himself to take my order. Now I just roll in.'],
  ["Vasken's Bakery", 'Lara', 4, 'Fresh bread from 7 in the morning. Not much space, but they move the chairs for you.'],

  ['Sarkis Market', 'Marc', 4, 'Wide aisles and an accessible toilet at the back. Parking right in front.'],
  ['Sarkis Market', 'Maya', 4, 'The toilet at the back is clean. The ramp at the door is a bit steep.'],
  ['Sarkis Market', 'Karim', 5, 'Parking at the door and they carry the bags to the car.'],

  ["Vasken's Pharmacy", 'Elie', 5, "Vasken knows all my grandmother's medicines by heart. No step, and a parking spot in front."],
  ["Vasken's Pharmacy", 'Maya', 4, 'The door is wide and the counter is low.'],
  ["Vasken's Pharmacy", 'Karim', 4, 'Open late, which saved me twice already.'],

  ['Vasken Hardware', 'Marc', 2, 'Good prices, but the shop is two steps down and full of boxes.'],
  ['Vasken Hardware', 'Hadi', 2, 'No way in with a wheelchair. Vasken came out to the street to copy my keys, which was kind.'],
  ['Vasken Hardware', 'Nour', 2, 'Narrow and crowded, not for strollers.'],

  ['Vasken Toys and Gifts', 'Lara', 5, 'Flat entrance, I got in with the double stroller.'],
  ['Vasken Toys and Gifts', 'Nour', 4, 'The kids loved it. The aisles are narrow around Christmas.'],
  ['Vasken Toys and Gifts', 'Rana', 4, 'Small ramp at the door, and the owner helped me reach the top shelves.'],

  ["Vasken's Sweets", 'Rana', 5, "Vasken's maamoul are the best in Antelias, and there is no step at the door."],
  ["Vasken's Sweets", 'Nour', 5, 'Parking in front and an accessible toilet, rare for a sweets shop.'],
  ["Vasken's Sweets", 'Karim', 4, 'Very busy before Easter, go early.'],
  ["Vasken's Sweets", 'Hadi', 5, 'The counter is low, I can choose my sweets myself.'],

  ['Vasken Grand Hotel', 'Marc', 5, 'My father had an accessible room with a roll-in shower. Vasken checks on every guest.'],
  ['Vasken Grand Hotel', 'Maya', 5, 'The most accessible hotel we found in the mountains.'],
  ['Vasken Grand Hotel', 'Lara', 4, 'Elevator down to the pool, very practical with the baby.'],

  ['Beit Mery Vine Terrace', 'Karim', 5, 'Parking at the door and a ramp to the terrace. Great view over Beirut.'],
  ['Beit Mery Vine Terrace', 'Elie', 4, 'Accessible toilet inside and the terrace is flat.'],
  ['Beit Mery Vine Terrace', 'Nour', 4, 'Good mezze, and the stroller fit between the tables.'],

  ['Aley Hillside Pharmacy', 'Hadi', 4, 'Ramp at the door. The street outside is steep though.'],
  ['Aley Hillside Pharmacy', 'Rana', 3, 'I can get in, but there is no parking nearby.'],

  ['Deir el Qamar Square Cafe', 'Maya', 2, 'Beautiful square, but the cafe is up three stone steps.'],
  ['Deir el Qamar Square Cafe', 'Marc', 2, 'We sat outside on the square. Inside is not possible with a wheelchair.'],
  ['Deir el Qamar Square Cafe', 'Lara', 3, 'Nice view, and the waiter helped me carry the stroller.'],

  ['Jounieh Bay Hotel', 'Karim', 4, 'Elevator to every floor and a large accessible bathroom. No reserved parking, I parked in the street.'],
  ['Jounieh Bay Hotel', 'Rana', 4, 'The elevator goes down to the beach level, which is rare in Jounieh.'],
  ['Jounieh Bay Hotel', 'Lara', 5, 'We came with the baby and the stroller, no stairs anywhere.'],

  ['Kaslik Shoe Gallery', 'Nour', 2, 'Two big steps at the door and nobody around to help. I could not get in with the stroller.'],
  ['Kaslik Shoe Gallery', 'Elie', 2, 'Two steps and nothing to hold. My grandmother waited outside.'],
  ['Kaslik Shoe Gallery', 'Hadi', 2, 'Steps at the door. They told me a ramp is coming soon, I will come back to check.'],

  ['Jounieh Marina Resort', 'Elie', 4, 'Elevator down to the pool and the sea. Parking is valet only.'],
  ['Jounieh Marina Resort', 'Maya', 4, 'The accessible room was clean and large.'],
  ['Jounieh Marina Resort', 'Marc', 3, 'Good overall, but the path to the beach ends with a step.'],

  ['Faraya Snow Lodge', 'Karim', 4, 'Ramp at the door and parking in front, even in winter.'],
  ['Faraya Snow Lodge', 'Lara', 5, 'Warm and easy with the baby. Accessible toilet in the lobby.'],
  ['Faraya Snow Lodge', 'Hadi', 4, 'No elevator, but the accessible rooms are on the ground floor.'],

  ['Sea Gate Grill', 'Marc', 5, 'Flat entrance on the beach side, accessible toilet and parking. Perfect for my father.'],
  ['Sea Gate Grill', 'Lara', 4, 'Easy access from the beach. The parking is full on weekends.'],
  ['Sea Gate Grill', 'Rana', 5, 'Accessible toilet, and the tables are high enough for a wheelchair.'],

  ['Byblos Souk Crafts', 'Nour', 2, 'The old souk is all stones and steps, and so is the shop.'],
  ['Byblos Souk Crafts', 'Rana', 1, 'I could only look from the street.'],
  ['Byblos Souk Crafts', 'Elie', 2, 'Nice crafts, but the step is too high for a walker.'],

  ['Souk Lantern Restaurant', 'Maya', 4, 'Entrance from the main street with no step, and an accessible toilet.'],
  ['Souk Lantern Restaurant', 'Marc', 4, 'We parked in the public lot, a bit far but fine.'],
  ['Souk Lantern Restaurant', 'Karim', 5, 'Great food, and the staff moved a table so I could sit with my crutches.'],

  ['Batroun Lemonade House', 'Rana', 4, 'A small ramp at the side door, the owner showed us. The old town streets around are uneven.'],
  ['Batroun Lemonade House', 'Elie', 4, 'Small ramp on the side. The lemonade is worth it.'],
  ['Batroun Lemonade House', 'Maya', 3, 'Getting in is fine, but there is no accessible toilet, so we did not stay long.'],

  ['Phoenician Wall Guesthouse', 'Karim', 2, 'Beautiful view but steps everywhere, even to reach the rooms.'],
  ['Phoenician Wall Guesthouse', 'Marc', 1, 'Steps at the entrance and to every room. Not for my father.'],
  ['Phoenician Wall Guesthouse', 'Nour', 2, 'Lovely place, but I carried the stroller up the stairs every time.'],

  ['Batroun Harbour Fish House', 'Lara', 5, 'Fresh fish on a flat terrace next to the boats.'],
  ['Batroun Harbour Fish House', 'Hadi', 5, 'Parking and toilet are accessible, I go every summer.'],
  ['Batroun Harbour Fish House', 'Rana', 4, 'The ramp is a bit steep, but it has handrails.'],

  ['Tripoli Sweets Corner', 'Nour', 3, 'The sweets are amazing. Steps at the entrance, but they bring the order out to the car.'],
  ['Tripoli Sweets Corner', 'Hadi', 3, 'Steps inside, but parking in front and they bring the knefeh to the car.'],
  ['Tripoli Sweets Corner', 'Elie', 3, 'My grandmother stayed in the car and the staff came out to us.'],

  ['Tripoli Old Souk Pharmacy', 'Karim', 4, 'Flat entrance, right in the middle of the souk.'],
  ['Tripoli Old Souk Pharmacy', 'Elie', 4, 'Very kind pharmacist, he came out to the car.'],

  ['Tripoli Downtown Institute', 'Maya', 5, 'Every floor has elevator access, even the old wing.'],
  ['Tripoli Downtown Institute', 'Hadi', 4, 'Accessible parking and toilets, good for students.'],
  ['Tripoli Downtown Institute', 'Nour', 4, 'I went to an event with my son, everything was accessible.'],

  ['Zgharta Main Road Market', 'Marc', 4, 'Reserved spots right at the door.'],
  ['Zgharta Main Road Market', 'Lara', 4, 'No step, and the big carts are fine next to the stroller.'],
  ['Zgharta Main Road Market', 'Karim', 3, 'No toilet for customers.'],

  ['Ehden Pine Hotel', 'Rana', 5, 'An elevator and an accessible bathroom, up in the mountains.'],
  ['Ehden Pine Hotel', 'Elie', 4, 'Cool in summer and easy with the walker. Parking is in the street.'],
  ['Ehden Pine Hotel', 'Nour', 4, 'Big family rooms on the ground floor.'],

  ['Bsharri Square Cafe', 'Hadi', 3, 'Ramp from the square, but no accessible toilet.'],
  ['Bsharri Square Cafe', 'Maya', 3, 'Good coffee with a view of the church. The streets around are steep.'],

  ['Berdawni River Terrace', 'Karim', 5, 'Flat terrace by the river, accessible toilet and parking. We go every summer with my grandmother.'],
  ['Berdawni River Terrace', 'Maya', 5, 'Flat path to the tables by the river and an accessible toilet.'],
  ['Berdawni River Terrace', 'Lara', 4, 'Busy on Sundays, come early to get a table near the water.'],

  ['Zahle Family Market', 'Nour', 4, 'Reserved parking near the door and wide aisles.'],
  ['Zahle Family Market', 'Elie', 5, 'There are benches inside to rest, my grandmother loved it.'],
  ['Zahle Family Market', 'Marc', 4, 'Accessible toilet near the entrance.'],

  ["Vasken's Grill", 'Marc', 5, 'Vasken grills the best kebab in Anjar. Flat entrance and an accessible toilet.'],
  ["Vasken's Grill", 'Rana', 5, 'Parking in front, and the staff are very kind.'],
  ["Vasken's Grill", 'Lara', 4, 'Big garden for the kids, no steps to get there.'],

  ['Temple View Guesthouse', 'Karim', 2, 'Parking at the door, but the rooms are up a staircase.'],
  ['Temple View Guesthouse', 'Maya', 1, 'Not possible in a wheelchair.'],
  ['Temple View Guesthouse', 'Nour', 3, 'The owner carried our bags and the stroller up the stairs.'],

  ['Rashaya Old Souk Cafe', 'Elie', 3, 'Accessible toilet inside, but two steps at the door.'],
  ['Rashaya Old Souk Cafe', 'Hadi', 2, 'I needed help to get in. Once inside, the toilet is fine.'],

  ['Old Souk Pharmacy', 'Rana', 4, 'No step at the door and the counter is low, so I can pay myself.'],
  ['Old Souk Pharmacy', 'Karim', 4, 'Quick service. Parking in the old city is hard.'],
  ['Old Souk Pharmacy', 'Lara', 5, 'The pharmacist came out to help me with the stroller.'],

  ['Old Saida Coffee House', 'Rana', 1, 'Lovely place but impossible in a wheelchair: steps at the door and a tiny toilet.'],
  ['Old Saida Coffee House', 'Marc', 2, 'Beautiful old house, but three steps and a narrow door.'],
  ['Old Saida Coffee House', 'Maya', 1, 'Steps everywhere, I could not even reach the terrace.'],

  ['Sea Castle Fish Restaurant', 'Rana', 5, 'Right in front of the sea castle, flat entrance and accessible toilet.'],
  ['Sea Castle Fish Restaurant', 'Karim', 4, 'Parking is limited, come early.'],
  ['Sea Castle Fish Restaurant', 'Nour', 5, 'High chairs for kids and space for the stroller.'],

  ['Saida Soap Shop', 'Lara', 4, 'Small ramp at the door, and the soap smells amazing.'],
  ['Saida Soap Shop', 'Marc', 3, 'Getting in is fine, but the alleys around are narrow.'],

  ['Jezzine Falls Restaurant', 'Maya', 5, 'Flat path to the tables near the waterfall.'],
  ['Jezzine Falls Restaurant', 'Elie', 4, 'Accessible toilet and parking. Bring a jacket, it gets cold in the evening.'],
  ['Jezzine Falls Restaurant', 'Hadi', 4, 'Great view. The ramp is long but not steep.'],

  ['Tyre Family Market', 'Karim', 4, 'Parking in front and wide aisles.'],
  ['Tyre Family Market', 'Nour', 4, 'Accessible toilet with a baby changing table, very useful.'],
  ['Tyre Family Market', 'Hadi', 5, 'I can reach almost every shelf by myself.'],

  ['Old Port Rooms', 'Marc', 5, 'Small hotel but with an elevator and a large bathroom. Rare in the old city.'],
  ['Old Port Rooms', 'Elie', 4, 'The elevator works well. The narrow streets outside are hard with a walker.'],
  ['Old Port Rooms', 'Rana', 4, 'Large bathroom with grab bars. No parking nearby, we left the car at the port.'],

  ['Al Mina Ruins Cafe', 'Rana', 4, 'Ramp from the street and a view of the ruins.'],
  ['Al Mina Ruins Cafe', 'Karim', 4, 'Nice stop after the visit. Parking is in the street.'],
  ['Al Mina Ruins Cafe', 'Nour', 3, 'Small place, no toilet for customers.'],

  ['Zaitunay Bay Seafood', 'Rana', 5, 'A glass elevator from the marina, a ramp at the door and an accessible toilet. The fish was perfect.'],
  ['Zaitunay Bay Seafood', 'Karim', 4, 'Reserved parking in the marina garage, then the elevator takes you up.'],
  ['Zaitunay Bay Seafood', 'Lara', 5, 'Lots of space between the tables for the stroller, and a view of the boats.'],

  ['Saifi Corner Cafe', 'Maya', 5, 'The elevator goes to the room upstairs, so I am not stuck on the ground floor anymore.'],
  ['Saifi Corner Cafe', 'Elie', 4, 'No step at the door. Parking in Saifi is paid and a bit far.'],

  ['Badaro Kitchen', 'Hadi', 4, 'Elevator to the terrace and a large accessible toilet. Busy on weekends.'],
  ['Badaro Kitchen', 'Nour', 4, 'We booked a table on the ground floor, easy with the stroller.'],
  ['Badaro Kitchen', 'Marc', 5, 'My father loved it. The staff knew how to help without making a fuss.'],

  ['Corniche Sunset Cafe', 'Rana', 5, 'Reserved parking at the door, a flat entrance and the sea in front.'],
  ['Corniche Sunset Cafe', 'Elie', 5, 'The terrace is level with the Corniche, my grandmother walked in with her walker.'],
  ['Corniche Sunset Cafe', 'Karim', 4, 'The toilet is accessible, but it is far at the back.'],

  ['Manara Rooftop Cafe', 'Rana', 5, 'An elevator straight up to the rooftop. Best sunset in Beirut.'],
  ['Manara Rooftop Cafe', 'Nour', 4, 'No step anywhere. Parking is in the street.'],

  ['Downtown City Market', 'Nour', 5, 'A big elevator from the parking, wide aisles and a baby changing room.'],
  ['Downtown City Market', 'Hadi', 4, 'Everything is accessible, some shelves are a bit high for me.'],
  ['Downtown City Market', 'Maya', 5, 'One cashier has a low counter, rare in Beirut.'],

  ['Saifi Concept Store', 'Lara', 5, 'Flat entrance, an elevator to the kids floor and a toilet with a changing table.'],
  ['Saifi Concept Store', 'Nour', 4, 'Nice design shop with wide aisles.'],

  ['Vasken Electronics', 'Hadi', 5, 'Vasken took the time to set up my new phone with me. Elevator to the second floor.'],
  ['Vasken Electronics', 'Elie', 4, 'Parking right in front, and they carried the TV to the car.'],

  ['Monot Pharmacy', 'Karim', 4, 'Ramp at the door and a bench to sit while you wait.'],
  ['Monot Pharmacy', 'Lara', 5, 'Open late and easy with the stroller.'],

  ['Corniche Rehabilitation Hospital', 'Hadi', 5, 'Made for wheelchairs: wide doors, elevators everywhere, adapted toilets.'],
  ['Corniche Rehabilitation Hospital', 'Marc', 5, 'My father did his rehabilitation here. Reserved parking right at the entrance.'],
  ['Corniche Rehabilitation Hospital', 'Elie', 4, 'Very accessible, the waiting room gets crowded.'],

  ['Waterfront Bank', 'Maya', 4, 'Automatic doors, an elevator, and the ATM is at wheelchair height.'],
  ['Waterfront Bank', 'Marc', 3, 'No toilet for clients, otherwise fine.'],

  ['Beirut Municipal Service Center', 'Rana', 4, 'A ramp and an elevator to the counters upstairs. Parking is the hard part.'],
  ['Beirut Municipal Service Center', 'Karim', 3, 'The building is accessible, but the line was long.'],

  ['Beirut Technical Institute', 'Maya', 5, 'Every building is connected with elevators and ramps.'],
  ['Beirut Technical Institute', 'Rana', 4, 'Accessible toilets on each floor. The campus is on a slope though.'],

  ['Achrafieh Public Library', 'Lara', 5, 'Ramp at the door, an elevator to every floor and a kids corner.'],
  ['Achrafieh Public Library', 'Marc', 4, 'Quiet and easy to move around with a wheelchair.'],
  ['Achrafieh Public Library', 'Rana', 5, 'The shelves on the ground floor are low enough for me.'],

  ['Dbayeh Hypermarket', 'Marc', 5, 'Reserved parking near the entrance, and wheelchairs to borrow inside.'],
  ['Dbayeh Hypermarket', 'Lara', 5, 'Huge aisles, perfect with the double stroller.'],
  ['Dbayeh Hypermarket', 'Karim', 4, 'Very busy on Saturdays, go in the morning.'],

  ['Byblos Garden Cafe', 'Elie', 4, 'Flat garden, accessible toilet and parking. Shade everywhere.'],
  ['Byblos Garden Cafe', 'Hadi', 4, 'Easy to get in, the gravel path is a bit bumpy.'],

  ['Byblos Arcade Gift Shop', 'Maya', 4, 'Unlike the rest of the souk, this shop has no step and even a toilet.'],
  ['Byblos Arcade Gift Shop', 'Marc', 4, 'Wide door, my father could get in with his wheelchair.'],

  ['Vasken Supermarket', 'Lara', 5, 'Vasken opened a big supermarket in Jbeil: elevator from the parking and wide aisles.'],
  ['Vasken Supermarket', 'Karim', 5, 'Everything is accessible, and the staff help you to the car.'],
  ['Vasken Supermarket', 'Rana', 4, 'Good, but the bakery corner gets crowded.'],

  ['El Mina Seaside Restaurant', 'Nour', 5, 'Parking next to the door and a ramp to the sea terrace.'],
  ['El Mina Seaside Restaurant', 'Hadi', 5, 'Fresh fish and a real accessible toilet.'],
  ['El Mina Seaside Restaurant', 'Elie', 4, 'A bit noisy, but very easy for my grandmother.'],

  ['Halba Municipality', 'Karim', 4, 'Ramp at the entrance and the counters are on the ground floor.'],
  ['Halba Municipality', 'Maya', 3, 'Accessible toilet, but no elevator for the offices upstairs.'],

  ['Halba Central Pharmacy', 'Marc', 4, 'Elevator to the floor with the medical supplies.'],
  ['Halba Central Pharmacy', 'Lara', 4, 'Parking in front and quick service.'],

  ['Zahle Plaza Bank', 'Maya', 4, 'Elevator, parking and an accessible toilet.'],
  ['Zahle Plaza Bank', 'Karim', 4, 'An employee came out to the car to help me.'],

  ['Saida Seafront Hospital', 'Rana', 5, 'Everything is accessible, even the parking garage.'],
  ['Saida Seafront Hospital', 'Nour', 4, 'Clean accessible toilets and big elevators.'],

  ['Old Saida Arches Restaurant', 'Hadi', 4, 'A gentle ramp under the arches and an accessible toilet, in the old city!'],
  ['Old Saida Arches Restaurant', 'Elie', 4, 'The alleys to get there are narrow, but the restaurant itself is easy.'],
];

// Several of each type all over Lebanon, so every search and "Near me" gives results.
// Each listing: supplier, title, type, rent or sale, price, area, lat, lng, photo
const SUPPLIERS = [
  'Georges Medical Supply', 'Mobility Lebanon', 'Cedar Rehab Equipment',
  'North Mobility Care', 'South Rehab Supply', 'Bekaa Medical Equipment',
];
const LISTINGS = [
  [0, 'Portable ramp 2 m', 'ramp', 'rent', 25, 'Achrafieh, Beirut', 33.8886, 35.5195,
    'Station worker with portable wheelchair ramp and wheelchair user - Tokyo - Akihabara stn Sep 20 2019 02-13PM.jpeg'],
  [0, 'Modular ramp 4 m', 'ramp', 'rent', 40, 'Achrafieh, Beirut', 33.8886, 35.5195, 'Modular Wheelchair Ramp - Upside Innovations.jpg'],
  [0, 'Threshold ramp for one step', 'ramp', 'sale', 35, 'Achrafieh, Beirut', 33.8886, 35.5195, 'Temporary access ramp, Brisbane 01.jpg'],
  [0, 'Folding wheelchair', 'wheelchair', 'sale', 180, 'Achrafieh, Beirut', 33.8886, 35.5195, 'Medline F-1 manual wheelchair 1.JPG'],
  [0, 'Wheelchair for a week', 'wheelchair', 'rent', 15, 'Achrafieh, Beirut', 33.8886, 35.5195, 'Blue folding lightweight wheelchair.jpg'],
  [1, 'Stair climber for apartments', 'stair-climber', 'rent', 60, 'Hamra, Beirut', 33.8963, 35.4818, 'GUS7910.jpg'],
  [1, 'Electric wheelchair', 'wheelchair', 'rent', 45, 'Hamra, Beirut', 33.8963, 35.4818, 'Pride Jazzy Select power chair 001.JPG'],
  [1, 'Walker with seat', 'walker', 'sale', 45, 'Hamra, Beirut', 33.8963, 35.4818, 'Rollator 2.jpg'],
  [1, 'Light walker', 'walker', 'rent', 8, 'Hamra, Beirut', 33.8963, 35.4818, 'Walker. frame.jpg'],
  [1, 'Aluminium ramp 3 m', 'ramp', 'sale', 220, 'Hamra, Beirut', 33.8963, 35.4818, 'Foldable ramp Manchester Piccadilly Station.jpg'],
  [1, 'Carbon rollator', 'walker', 'sale', 260, 'Hamra, Beirut', 33.8963, 35.4818, 'Rollator-carbon.jpg'],
  [2, 'Folding ramp 1.5 m', 'ramp', 'rent', 20, 'Jounieh', 33.9808, 35.6178, 'Wheelchair and temporary train ramp in Tokyo 2019 5 25.jpeg'],
  [2, 'Transport wheelchair', 'wheelchair', 'sale', 150, 'Jounieh', 33.9808, 35.6178, 'Stryker Prime TC wheelchair.jpg'],
  [2, 'Van ramp for a wheelchair', 'ramp', 'rent', 35, 'Jounieh', 33.9808, 35.6178,
    'Rear ramp load of wheelchair, QDN Office, Hamilton Place Bowen Hills IMGP8391.jpg'],
  [2, 'Shower chair', 'other', 'sale', 30, 'Jdeideh', 33.889, 35.558, 'SOLD Shower chair, bath transfer bench, toilet riser (4861775529).jpg'],
  [2, 'Grab bars for the bathroom (set of 2)', 'other', 'sale', 25, 'Jdeideh', 33.889, 35.558, 'Grab bar.jpg'],
  [3, 'Rollator with brakes', 'walker', 'rent', 6, 'Tripoli', 34.4335, 35.838, 'My rollator.jpg'],
  [3, 'Crutches (pair)', 'other', 'rent', 3, 'Tripoli', 34.4335, 35.838, 'Axillary Crutches.jpg'],
  [3, 'Transfer bench for the bath', 'other', 'sale', 40, 'Tripoli', 34.4335, 35.838, 'Transfer bench.jpg'],
  [4, 'Stair climber', 'stair-climber', 'rent', 55, 'Saida', 33.5571, 35.3729, 'Tag A5 Treppensteiger.jpg'],
  [4, 'Walking frame', 'walker', 'sale', 35, 'Saida', 33.5571, 35.3729, 'Walker extended.JPG'],
  [4, 'Raised toilet seat', 'other', 'sale', 20, 'Saida', 33.5571, 35.3729, 'Age-friendly tools 3.jpg'],
  [5, 'Electric add-on for a wheelchair', 'wheelchair', 'rent', 30, 'Zahle', 33.8463, 35.902,
    'UNAwheel Mini Active wheelchair power add-on in Los Angeles.jpg'],
  [5, 'Walker with seat', 'walker', 'rent', 7, 'Zahle', 33.8463, 35.902, 'Winnie Walker EXP Steel Rollator 002 CR.JPG'],
  [5, 'Evacuation stair chair', 'stair-climber', 'sale', 450, 'Zahle', 33.8463, 35.902, 'Escape-Chair on stair case.jpg'],
];

// The email of a demo account: "Hotel Cedar Bay" -> hotel-cedar-bay@demo.accesspath.lb
function demoEmail(name) {
  const slug = name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug + DOMAIN;
}

await mongoose.connect(process.env.MONGODB_URI);

// 1. Remove the demo data of a previous run
const oldUsers = await User.find({ email: { $regex: 'demo\\.accesspath\\.lb$' } });
const oldIds = oldUsers.map((u) => u._id);
const oldPlaces = await Place.find({ ownerId: { $in: oldIds } });
const oldListings = await Listing.find({ ownerId: { $in: oldIds } });
await Review.deleteMany({ $or: [{ userId: { $in: oldIds } }, { placeId: { $in: oldPlaces.map((p) => p._id) } }] });
await Request.deleteMany({ $or: [{ seekerId: { $in: oldIds } }, { listingId: { $in: oldListings.map((l) => l._id) } }] });
await Listing.deleteMany({ ownerId: { $in: oldIds } });
await Place.deleteMany({ ownerId: { $in: oldIds } });
await User.deleteMany({ _id: { $in: oldIds } });

// 2. Accounts (one hash for everyone, it is the same password)
const passwordHash = await bcrypt.hash(PASSWORD, 12);
const makeUser = (name, role) => User.create({ name, email: demoEmail(name), passwordHash, role });

// Places and visitors are kept by name, so the reviews can find them
const places = {};
for (const [name, category, address, lat, lng, criteria, cover, accessKey, accessPhoto] of PLACES) {
  const [stepFree, elevator, toilets, parking] = criteria;
  const owner = await makeUser(name, 'venue');
  places[name] = await Place.create({
    ownerId: owner._id, name, category, address, lat, lng, stepFree, elevator, toilets, parking,
    photos: [commonsUrl(cover)],
    accessPhotos: { [accessKey]: commonsUrl(accessPhoto) },
  });
}

const visitors = {};
for (const name of VISITORS) visitors[name] = await makeUser(name, 'user');

const reviews = {}; // "place|visitor" -> the review, to add the replies below
for (const [placeName, visitorName, rating, comment] of REVIEWS) {
  reviews[`${placeName}|${visitorName}`] = await Review.create({
    placeId: places[placeName]._id, userId: visitors[visitorName]._id, rating, comment,
  });
}

// A few replies of the owners, like on Google Maps. Some reviews stay without a reply,
// so "My reviews" has some waiting (log in as kaslik-shoe-gallery to see both)
const REPLIES = [
  ["Vasken's Bakery", 'Hadi', 'Thank you Hadi! The door is always open for you, the cheese manakish is waiting.'],
  ['Kaslik Shoe Gallery', 'Nour', 'We are sorry Nour. We rented a ramp on AccessFix last week, please come back and tell us.'],
  ['Kaslik Shoe Gallery', 'Hadi', 'The ramp is here now! Thank you for your patience.'],
  ['Chez Vasken', 'Rana', 'You are right Rana, we asked for a ramp on AccessFix. It should be installed this week.'],
  ['Hotel Cedar Bay', 'Marc', 'Thank you Marc. We are adding two reserved spots closer to the entrance this month.'],
  ['Phoenician Wall Guesthouse', 'Marc', 'We understand. We asked a supplier for a ramp at the entrance, and we are looking for a solution for the rooms.'],
  ['Old Saida Coffee House', 'Maya', 'Thank you for telling us. We are trying a stair climber this week, we hope to welcome you soon.'],
  ['Vasken Grand Hotel', 'Maya', 'Thank you Maya, it was a pleasure to have you with us.'],
  ['Temple View Guesthouse', 'Maya', 'We are sorry. We are looking for a stair climber for the summer and will update our page.'],
  ['Sarkis Market', 'Maya', 'Thanks Maya, we will make the ramp less steep when we redo the entrance in the spring.'],
  ["Vasken's Pharmacy", 'Elie', 'Say hello to your grandmother from all of us!'],
  ['Corniche Sunset Cafe', 'Karim', 'Thank you Karim, we are moving the accessible toilet closer to the terrace this winter.'],
  ['Hamra Fresh Market', 'Karim', 'Thank you Karim. Two parking spots in front will be reserved from next month.'],
  ['Byblos Souk Crafts', 'Rana', 'We are sorry Rana. A small ramp is on its way, we will update our page as soon as it is here.'],
];
for (const [placeName, visitorName, text] of REPLIES) {
  const review = reviews[`${placeName}|${visitorName}`];
  review.reply = text;
  review.repliedAt = new Date();
  await review.save();
}

const suppliers = [];
for (const name of SUPPLIERS) suppliers.push(await makeUser(name, 'supplier'));

const listings = [];
for (const [s, title, type, mode, price, area, lat, lng, photo] of LISTINGS) {
  listings.push(await Listing.create({
    ownerId: suppliers[s]._id, title, type, mode, price, area, lat, lng, photoUrl: commonsUrl(photo),
  }));
}

// 3. Requests, so "My requests" and "Requests received" are not empty.
// People with reduced mobility ask for themselves or a relative,
// businesses ask for their place. Each one: who asks, listing number in LISTINGS, status, message
const REQUESTS = [
  [visitors.Rana, 0, 'pending',
    'I use a wheelchair and there are two steps at the entrance of my building in Achrafieh. Can I rent it for a month?'],
  [visitors.Rana, 22, 'accepted',
    'I am visiting my family in Zahle next week and the streets there are steep. Can I rent it for 5 days?'],
  [visitors.Marc, 6, 'accepted',
    'For my father, he cannot push his wheelchair for long anymore. We would need it for two weeks.'],
  [visitors.Elie, 16, 'pending',
    'For my grandmother in Tripoli, she needs a walker with a seat to rest on.'],
  [visitors.Karim, 17, 'declined',
    'I broke my ankle. Do you have a smaller size?'],
  [places['Kaslik Shoe Gallery'].ownerId, 11, 'accepted',
    'We have two steps at our entrance in Kaslik. We would like to rent it while we build a permanent ramp.'],
  [places['Chez Vasken'].ownerId, 2, 'pending',
    'One big step at the door of our cafe in Gemmayzeh. Can you install it this week?'],
  [places['Phoenician Wall Guesthouse'].ownerId, 9, 'pending',
    'Our guesthouse in Batroun has steps at the entrance. Can you deliver to Batroun?'],
  [places['Temple View Guesthouse'].ownerId, 5, 'pending',
    'Our rooms are upstairs and we have no elevator. Can we rent a stair climber for the summer?'],
  [places['Old Saida Coffee House'].ownerId, 19, 'accepted',
    'Three steps at our door in the old city. Can we try the stair climber for a week?'],
];
for (const [seeker, l, status, message] of REQUESTS) {
  const seekerId = seeker._id ?? seeker; // a visitor account, or the owner id of a place
  await Request.create({ listingId: listings[l]._id, seekerId, status, message });
}

console.log(`${PLACES.length} places, ${VISITORS.length} visitors, ${REVIEWS.length} reviews (${REPLIES.length} with a reply), ${listings.length} listings, ${REQUESTS.length} requests added`);
console.log(`Log in with any demo email (e.g. ${demoEmail('Rana')}) and the password ${PASSWORD}`);
await mongoose.disconnect();
