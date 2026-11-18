// Demo data, so the map and the lists are not empty during the demo:
// 47 places in 22 towns of Lebanon (each one with its own venue account and 2 photos),
// 8 visitors who leave reviews (2 to 4 per place), 3 equipment suppliers with 14 listings,
// and a few requests.
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
// a photo of its street (the cover) and a photo of what matters for access
// (the ramp or the steps at the door, the elevator, the toilets or the parking).
const PLACES = [
  // Beirut
  ['Hotel Cedar Bay', 'hotel', 'Ain el Mreisseh, Beirut', 33.9002, 35.4878,
    [true, true, true, true], 'Another rainy Beirut day.jpg', '3 elevators.jpg'],
  ['Hamra Fresh Market', 'supermarket', 'Hamra Street, Beirut', 33.8968, 35.483,
    [true, false, false, false], 'Hamra Street, Beirut (1).jpg', 'Entrance with ramp (5866504842).jpg'],
  ['Hamra Corner Books', 'shop', 'Hamra, Beirut', 33.896, 35.4815,
    [true, false, false, false], 'Rue Hamra Sign.jpg', 'SSF Main Library wheelchair ramp 1.JPG'],
  ['Verdun Garden Cafe', 'cafe', 'Verdun, Beirut', 33.8865, 35.485,
    [true, false, true, true], 'Verdun beirut.jpg', 'Diagonal handicapped parking space (18463401242).jpg'],
  ['Chez Vasken', 'cafe', 'Gouraud Street, Gemmayzeh, Beirut', 33.8952, 35.5153,
    [false, false, false, false], 'Gemmayzeh (4694185351).jpg',
    'Lyttelton House Gallery, Priory Steps, Malvern - geograph.org.uk - 1305094.jpg'],
  ['Sioufi Garden Cafe', 'cafe', 'Sioufi, Achrafieh, Beirut', 33.8868, 35.5262,
    [true, false, true, false], 'Sioufi Garden Achrafieh District 01.jpg',
    'Accessible toilet Platform 10 Roma Street Station Brisbane P1110354.jpg'],
  ['Achrafieh Savings Bank', 'bank', 'Achrafieh, Beirut', 33.8887, 35.5205,
    [true, true, false, false], 'Zahrat al Ihsan Street, Achrafieh, Beirut.jpg',
    'Destination control elevator interior 2.jpg'],
  ['Achrafieh Medical Center', 'hospital', 'Achrafieh, Beirut', 33.8835, 35.5235,
    [true, true, true, true], 'Achrafieh.jpg',
    'Interior of a vintage Montgomery elevator with a modified controller.jpg'],

  // Bourj Hammoud
  ["Vasken's Bakery", 'restaurant', 'Armenia Street, Bourj Hammoud', 33.8925, 35.5425,
    [true, false, false, false], 'Beirut Bourj Hammoud - 2018 - 08.jpg', 'Accessible entrance at UCMS.jpg'],
  ['Sarkis Market', 'supermarket', 'Arax Street, Bourj Hammoud', 33.8908, 35.5397,
    [true, false, true, true], 'Beirut Bourj Hammoud - 2018 - 11.jpg', 'Disabled Parking Space in Málaga.jpg'],
  ["Vasken's Pharmacy", 'pharmacy', 'Marash Street, Bourj Hammoud', 33.893, 35.541,
    [true, false, false, true], 'Beirut Bourj Hammoud - 2018 - 12.jpg', 'Wheelchair ramp sign .jpg'],
  ['Vasken Hardware', 'shop', 'Arax Street, Bourj Hammoud', 33.8902, 35.539,
    [false, false, false, false], 'Beirut Bourj Hammoud - 2018 - 07.jpg', 'Old steps - geograph.org.uk - 415706.jpg'],
  ['Vasken Toys and Gifts', 'shop', 'Armenia Street, Bourj Hammoud', 33.8918, 35.544,
    [true, false, false, false], 'Beirut Bourj Hammoud - 2018 - 10.jpg',
    '7-Eleven Dongji Store wheelchair ramp 20221020.jpg'],

  // Mount Lebanon
  ["Vasken's Sweets", 'restaurant', 'Main road, Antelias', 33.9145, 35.5875,
    [true, false, true, true], 'Antelias Mar Elias.JPG', 'Disabled Parking Space in Virreina Neighbourhood.jpg'],
  ['Vasken Grand Hotel', 'hotel', 'Main road, Broummana', 33.881, 35.6215,
    [true, true, true, true], 'Broumana From Hazmieh, Lebanon.jpg',
    'Schindler 330A hydraulic elevator interior with cascading doors.jpg'],
  ['Beit Mery Vine Terrace', 'restaurant', 'Beit Mery', 33.856, 35.5995,
    [true, false, true, true], 'Beit Meri - Grapevine on Balcony (2318594652).jpg',
    'Accessible toiletblock with ramp and handrail (6253938166).jpg'],
  ['Aley Hillside Pharmacy', 'pharmacy', 'Main street, Aley', 33.8095, 35.5995,
    [true, false, false, false], 'Aley Lebanon Houses and hillside.jpg',
    'Entrance ramp on Market Place, Candler Building (1912; renovated 1990), 101-125 Market Place, Baltimore, MD 21202.jpg'],
  ['Deir el Qamar Square Cafe', 'cafe', 'Main square, Deir el Qamar', 33.6965, 35.5615,
    [false, false, false, false], 'Deir El-Qamar 02.jpg', 'Entrance to Heatherslaw Mill Shop - geograph.org.uk - 1555460.jpg'],
  ['Jounieh Bay Hotel', 'hotel', 'Seaside road, Jounieh', 33.9808, 35.6178,
    [true, true, true, false], 'Bayofjouniehviewfromrabieh2.JPG', 'Handicap toilet 2.jpg'],
  ['Kaslik Shoe Gallery', 'shop', 'Kaslik, Jounieh', 33.9695, 35.6125,
    [false, false, false, false], '3133 (8)jounieh.JPG', 'Bibliotheque Saint-Sulpice 12.JPG'],
  ['Jounieh Marina Resort', 'hotel', 'Seaside, Jounieh', 33.976, 35.615,
    [true, true, true, false], 'Jounieh 2.jpg', 'Disabled accessible toilet Haringey.jpg'],
  ['Faraya Snow Lodge', 'hotel', 'Main road, Faraya', 33.979, 35.8195,
    [true, false, true, true], 'The village of faraya.jpg', 'Handicap Parking Space (32283094777).jpg'],

  // North
  ['Sea Gate Grill', 'restaurant', 'Seaside, Byblos', 34.121, 35.646,
    [true, false, true, true], 'Beach in Byblos.JPG', 'Disabled Parking in Gibralfaro.jpg'],
  ['Byblos Souk Crafts', 'shop', 'Old souk, Byblos', 34.1208, 35.6478,
    [false, false, false, false], 'ByblosOldSouk.jpg', 'Steps at the entrance to Grand Central - geograph.org.uk - 4693180.jpg'],
  ['Souk Lantern Restaurant', 'restaurant', 'Old souk, Byblos', 34.1214, 35.6484,
    [true, false, true, false], 'ByblosSoukNight.jpg', 'Charlecote Park disabled toilet Warwickshire England.jpg'],
  ['Batroun Lemonade House', 'cafe', 'Old town, Batroun', 34.2553, 35.6588,
    [true, false, false, false], 'Batroun - Old Street (2308265587).jpg', 'Access Ramp 1.JPG'],
  ['Phoenician Wall Guesthouse', 'hotel', 'Seaside, Batroun', 34.2565, 35.6555,
    [false, false, false, false], 'Arches and the natural sea wall of the old city (2308265699).jpg',
    'An old dorway with steps - geograph.org.uk - 254063.jpg'],
  ['Batroun Harbour Fish House', 'restaurant', 'Old port, Batroun', 34.255, 35.6585,
    [true, false, true, true], 'Batroun port IMG 1038.jpg', 'On-street parallel handicapped parking space (18521571846).jpg'],
  ['Tripoli Sweets Corner', 'restaurant', 'Old city, Tripoli', 34.4367, 35.8497,
    [false, false, false, true], "'Sour' dough (5348283264).jpg",
    'Abraham J. Friedlander House, Cincinnati, OH (46438201195).jpg'],
  ['Tripoli Old Souk Pharmacy', 'pharmacy', 'Old souks, Tripoli', 34.4345, 35.844,
    [true, false, false, false], 'Historical districts, streets of Tripoli, Lebanon.jpg', 'Accessible entrance.jpg'],
  ['Tripoli Downtown Institute', 'university', 'Downtown, Tripoli', 34.437, 35.835,
    [true, true, true, true], 'Downtown Tripoli, old buildings, Tripoli, Lebanon.jpg',
    'ThyssenKrupp wheelchair lift in Moscow 01.jpg'],
  ['Zgharta Main Road Market', 'supermarket', 'Main road, Zgharta', 34.397, 35.895,
    [true, false, false, true], 'La route principale à Zghorta.jpg', 'B5 Johor Street Market - Disabled Parking.jpg'],
  ['Ehden Pine Hotel', 'hotel', 'Main square, Ehden', 34.2915, 35.9935,
    [true, true, true, false], 'Vue de Ehden et du Mont-Liban.JPG', 'Lift doors - geograph.org.uk - 5562733.jpg'],
  ['Bsharri Square Cafe', 'cafe', 'Main square, Bsharri', 34.251, 36.011,
    [true, false, false, false], 'Bsharri church and main square with a statue of angel, Bsharri, Lebanon.jpg',
    'Hull Maritime Museum New Wheelchair Ramp, Kingston upon Hull Jun24.jpg'],

  // Bekaa
  ['Berdawni River Terrace', 'restaurant', 'Berdawni, Zahle', 33.853, 35.902,
    [true, false, true, true], 'Berdawnicafe.jpg', 'Accessible toilet in Japan.JPG'],
  ['Zahle Family Market', 'supermarket', 'Main street, Zahle', 33.8463, 35.902,
    [true, false, true, true], 'Zahle,Lebanon.JPG', 'Disabled Parking Spaces in Seminario.jpg'],
  ["Vasken's Grill", 'restaurant', 'Main street, Anjar', 33.7275, 35.9325,
    [true, false, true, true], 'Anjar Street, March 2017.jpg',
    'Accessible toilet at Majiapu Station (20181231133605).jpg'],
  ['Temple View Guesthouse', 'hotel', 'Near the temples, Baalbek', 34.0055, 36.2085,
    [false, false, false, true], 'Temple of Jupiter, Baalbek, Lebanon (5073942385).jpg',
    'Handicapped parking space outside of the Combi, Aschendorf (2017).jpg'],
  ['Rashaya Old Souk Cafe', 'cafe', 'Old souk, Rashaya', 33.4985, 35.843,
    [false, false, true, false], 'Rashaya.jpg', 'Toilet for disabled people with wheelchairs.jpg'],

  // South
  ['Old Souk Pharmacy', 'pharmacy', 'Old city, Saida', 33.563, 35.37,
    [true, false, false, false], 'Streets of Sidon, Lebanon.jpg', 'Accès pour handicapés 01.jpg'],
  ['Old Saida Coffee House', 'cafe', 'Old city, Saida', 33.5628, 35.3712,
    [false, false, false, false], 'Old city of Sidon, Lebanon.jpg', "Ataman's district building (entrance).jpg"],
  ['Sea Castle Fish Restaurant', 'restaurant', 'Seafront, Saida', 33.5665, 35.373,
    [true, false, true, true], 'Sidon Sea Castle, Sidon, Lebanon.jpg',
    'Changing Places Accessible Toilet for Disabled Inclusion.jpg'],
  ['Saida Soap Shop', 'shop', 'Old souks, Saida', 33.5612, 35.3718,
    [true, false, false, false], 'Alleyways, Old city of Sidon, Lebanon.jpg', 'Handrails in the ramp for wheelchair users.jpg'],
  ['Jezzine Falls Restaurant', 'restaurant', 'Near the waterfall, Jezzine', 33.544, 35.585,
    [true, false, true, true], 'Jezzine 3.JPG', 'Accessible toilet Brisbane Airport Domestic Terminal IMGP5513.jpg'],
  ['Tyre Family Market', 'supermarket', 'Main road, Tyre', 33.2705, 35.196,
    [true, false, true, true], 'City Road 01.JPG', 'Accessible toilet.jpg'],
  ['Old Port Rooms', 'hotel', 'Christian quarter, Tyre', 33.2745, 35.1945,
    [true, true, true, false], 'TyreNarrowStChrQrt.jpg', 'Analysing elevator control buttons (7771545062).jpg'],
  ['Al Mina Ruins Cafe', 'cafe', 'Al Mina, Tyre', 33.268, 35.1965,
    [true, false, false, false], 'Remains of ancient columns at Al Mina excavation site, Tyre, Lebanon.jpg',
    'Steps, handrail and ramp, Gate No.2 - geograph.org.uk - 2613734.jpg'],
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
];

// Several of each type, in and around Beirut, so every search gives results
const SUPPLIERS = ['Georges Medical Supply', 'Mobility Lebanon', 'Cedar Rehab Equipment'];
const LISTINGS = [
  [0, 'Portable ramp 2 m', 'ramp', 'rent', 25, 'Achrafieh, Beirut'],
  [0, 'Modular ramp 4 m', 'ramp', 'rent', 40, 'Achrafieh, Beirut'],
  [0, 'Threshold ramp for one step', 'ramp', 'sale', 35, 'Achrafieh, Beirut'],
  [0, 'Folding wheelchair', 'wheelchair', 'sale', 180, 'Achrafieh, Beirut'],
  [0, 'Wheelchair for a week', 'wheelchair', 'rent', 15, 'Achrafieh, Beirut'],
  [1, 'Stair climber for apartments', 'stair-climber', 'rent', 60, 'Hamra, Beirut'],
  [1, 'Electric wheelchair', 'wheelchair', 'rent', 45, 'Hamra, Beirut'],
  [1, 'Walker with seat', 'walker', 'sale', 45, 'Hamra, Beirut'],
  [1, 'Light walker', 'walker', 'rent', 8, 'Hamra, Beirut'],
  [1, 'Aluminium ramp 3 m', 'ramp', 'sale', 220, 'Hamra, Beirut'],
  [2, 'Folding ramp 1.5 m', 'ramp', 'rent', 20, 'Jounieh'],
  [2, 'Transport wheelchair', 'wheelchair', 'sale', 150, 'Jounieh'],
  [2, 'Shower chair', 'other', 'sale', 30, 'Jdeideh'],
  [2, 'Portable stair handrail', 'other', 'rent', 10, 'Jdeideh'],
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
for (const [name, category, address, lat, lng, criteria, cover, accessPhoto] of PLACES) {
  const [stepFree, elevator, toilets, parking] = criteria;
  const owner = await makeUser(name, 'venue');
  places[name] = await Place.create({
    ownerId: owner._id, name, category, address, lat, lng, stepFree, elevator, toilets, parking,
    photos: [commonsUrl(cover), commonsUrl(accessPhoto)],
  });
}

const visitors = {};
for (const name of VISITORS) visitors[name] = await makeUser(name, 'user');

for (const [placeName, visitorName, rating, comment] of REVIEWS) {
  await Review.create({ placeId: places[placeName]._id, userId: visitors[visitorName]._id, rating, comment });
}

const suppliers = [];
for (const name of SUPPLIERS) suppliers.push(await makeUser(name, 'supplier'));

const listings = [];
for (const [s, title, type, mode, price, area] of LISTINGS) {
  listings.push(await Listing.create({ ownerId: suppliers[s]._id, title, type, mode, price, area }));
}

// 3. A few requests, so "My requests" and "Requests received" are not empty
await Request.create({
  listingId: listings[0]._id, seekerId: visitors.Rana._id,
  message: 'For a wedding on Saturday in Broummana, can you deliver?',
});
await Request.create({
  listingId: listings[0]._id, seekerId: places['Kaslik Shoe Gallery'].ownerId, status: 'accepted',
  message: 'We have two steps at the entrance, we would like to rent it for a month.',
});
await Request.create({
  listingId: listings[3]._id, seekerId: visitors.Marc._id, status: 'declined',
  message: 'Is it still available?',
});

console.log(`${PLACES.length} places, ${VISITORS.length} visitors, ${REVIEWS.length} reviews, ${listings.length} listings added`);
console.log(`Log in with any demo email (e.g. ${demoEmail('Rana')}) and the password ${PASSWORD}`);
await mongoose.disconnect();
