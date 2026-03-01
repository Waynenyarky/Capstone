#!/usr/bin/env python3
"""One-off script to generate 400 LOB dataset entries (5 per LOB)."""
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")
OUT_PATH = os.path.join(AI_ROOT, "datasets", "generated_batch_1.json")

def load_lobs():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    lobs = []
    for entry in data:
        tc = entry["taxCode"]
        lob = entry["lineOfBusiness"]
        codes = entry.get("psicCodes", [])
        for i, dl in enumerate(entry["detailedLines"]):
            psic = codes[i] if i < len(codes) else ""
            lobs.append({
                "taxCode": tc,
                "lineOfBusiness": lob,
                "detailedLine": dl,
                "psicCode": psic,
            })
    return lobs

# 5 description variants per LOB. Keys are (taxCode, detailedLine).
VARIANTS = {
    ("RET", "Sari-sari store"): [
        "Maliit na tindahan sa kanto na nagbebenta ng bigas, de-lata, sabon, at pang-araw-araw na pangangailangan ng kapitbahay.",
        "We operate a small neighborhood store selling rice, canned goods, soap, and daily necessities.",
        "Tindahan sa residential area na nagbebenta ng noodles, candies, shampoo sachet, at basic grocery.",
        "Small store near the school selling snacks, drinks, and school supplies to students and families.",
        "Nagtitinda ng bigas, asukal, mantika, at mga de-lata sa maliit na tindahan sa barangay.",
    ],
    ("RET", "Convenience store"): [
        "We operate a 24/7 minimart beside the highway selling snacks, drinks, toiletries, and basic groceries for travelers and residents.",
        "Minimart na bukas 24 oras, nagbebenta ng instant noodles, beverages, at toiletries.",
        "Convenience store inside a gas station selling chips, coffee, and ready-to-eat meals.",
        "24/7 store near the hospital for night-shift workers and visitors needing snacks and drinks.",
        "Small minimart at the bus terminal selling travel-sized items and quick meals.",
    ],
    ("RET", "General merchandise"): [
        "Tindahan ng mga gamit sa bahay, school supplies, at grocery items para sa mga pamilya sa barangay.",
        "We run a general merchandise store selling various goods from groceries to home supplies.",
        "Department store style small business — clothes, kitchenware, toys, and school supplies.",
        "Nagbebenta kami ng iba't ibang produkto: grocery, gamit sa bahay, at school supplies.",
        "General merchandise retail: household items, stationery, and basic apparel in one store.",
    ],
    ("RET", "Hardware & construction supplies"): [
        "Nagbebenta kami ng semento, bakal, pintura, at mga kagamitan sa construction para sa mga contractor at DIY.",
        "We sell hardware and construction materials like cement, steel bars, and plywood.",
        "Hardware store selling paint, plumbing supplies, electrical wires, and construction tools.",
        "Tindahan ng hollow blocks, buhangin, semento, at mga kagamitan sa construction.",
        "Retail of power tools, nails, screws, and building materials for homeowners and contractors.",
    ],
    ("RET", "Pharmacy / drugstore"): [
        "Botika na nagbebenta ng gamot na may reseta, over-the-counter, at mga health at beauty products.",
        "I own a pharmacy that sells prescription and over-the-counter medicine.",
        "Drugstore with vitamins, first-aid supplies, and personal care products.",
        "May botika kami na nagbebenta ng gamot, vitamins, at mga health products.",
        "Pharmacy offering generic and branded medicines, and basic medical supplies.",
    ],
    ("RET", "Clothing & apparel"): [
        "Retail store selling ready-to-wear clothes, shoes, and accessories for men, women, and children.",
        "We sell clothing, shoes, bags, and fashion accessories.",
        "Nagbebenta kami ng damit, sapatos, at mga accessories para sa pamilya.",
        "Boutique selling casual and formal wear for men and women.",
        "Apparel store for school uniforms, workwear, and everyday clothing.",
    ],
    ("RET", "Electronics & gadgets"): [
        "Nagbebenta kami ng cellphone, laptop, tablet, at mga accessories tulad ng charger at cases.",
        "I sell smartphones, laptops, and electronic gadgets.",
        "Electronics retail: mobile phones, computers, and peripherals.",
        "Store selling gadgets, power banks, earphones, and phone accessories.",
        "Nagbebenta ng laptops, tablets, at computer accessories para sa estudyante at professionals.",
    ],
    ("RET", "Auto parts & accessories"): [
        "We sell tires, batteries, engine oil, and spare parts for cars and motorcycles.",
        "Nagbebenta kami ng mga spare parts ng sasakyan, gulong, at car accessories.",
        "Auto supply store for replacement parts, fluids, and car care products.",
        "Motorcycle and car parts retail — tires, batteries, and maintenance supplies.",
        "Tindahan ng auto parts: brake pads, filters, at accessories para sa sasakyan.",
    ],
    ("RET", "Fuel / gasoline station"): [
        "Gasolinahan na nagbebenta ng unleaded, diesel, at premium fuel; may convenience store din.",
        "We operate a gasoline station where people refuel their cars and motorcycles.",
        "Fuel station with unleaded, diesel, and LPG; small convenience store attached.",
        "May gasolinahan kami na nagbebenta ng diesel at gasolina; may car wash din.",
        "Gas station along the highway with 24/7 fuel and basic retail.",
    ],
    ("RET", "Agricultural supplies"): [
        "Tindahan ng pataba, binhi, feeds para sa manok at baboy, at farm tools para sa mga magsasaka.",
        "I sell fertilizers, seeds, animal feeds, and other farm supplies.",
        "Agricultural supply store: seeds, pesticides, and hand tools for farmers.",
        "Nagbebenta kami ng pataba, binhi, at feeds para sa mga magsasaka at livestock raisers.",
        "Farm supply retail — animal feeds, veterinary products, and farm equipment.",
    ],
    ("WHL", "Agricultural raw materials"): [
        "Wholesale supplier of palay, corn, and other grains to rice mills and supermarkets.",
        "Nag-su-supply kami ng palay, mais, at iba pang grains sa mga rice mill at palengke.",
        "We supply rice, corn, and grains in bulk to processors and distributors.",
        "Wholesale of raw agricultural produce for food manufacturing and export.",
        "Bulk supplier ng palay at mais sa mga rice mill at grocery chains.",
    ],
    ("WHL", "Food & beverages (wholesale)"): [
        "Nag-su-supply kami ng mga pagkain at inumin sa mga restaurant, hotel, at grocery sa bulk.",
        "I supply food and beverages in bulk to restaurants and supermarkets.",
        "Wholesale distributor of canned goods, noodles, and beverages to retailers.",
        "We distribute frozen meat, dairy, and dry goods to restaurants and canteens.",
        "Bulk supplier ng mga pagkain at inumin sa mga restaurant at convenience stores.",
    ],
    ("WHL", "Household goods (wholesale)"): [
        "We distribute kitchenware, cleaning supplies, and household items to retailers in the province.",
        "Wholesale ng kitchenware, cleaning supplies, at household items sa mga tindahan.",
        "Bulk distributor of soap, detergent, and home care products to stores.",
        "Nagdi-distribute kami ng mga gamit sa bahay sa mga retailers at sari-sari stores.",
        "Wholesale household goods: plastic ware, utensils, and cleaning products.",
    ],
    ("WHL", "Industrial machinery & equipment"): [
        "Wholesale ng industrial machinery, forklift, at heavy equipment para sa factories at construction.",
        "We sell industrial machinery and heavy equipment to businesses.",
        "Distributor of factory equipment, generators, and industrial tools.",
        "Nagbebenta kami ng malalaking makina at kagamitan para sa factory at construction.",
        "Wholesale of welding machines, compressors, and industrial supplies.",
    ],
    ("WHL", "Construction materials (wholesale)"): [
        "Nagbebenta kami ng hollow blocks, sand, gravel, at cement sa bulk para sa mga contractor.",
        "I sell construction materials in bulk — hollow blocks, gravel, sand — to contractors.",
        "Wholesale construction supplies to contractors and building firms.",
        "Bulk supplier ng semento, bakal, at hollow blocks sa mga construction companies.",
        "We supply sand, gravel, and cement in bulk for large construction projects.",
    ],
    ("WHL", "Chemicals & fertilizers"): [
        "Supplier of fertilizers, pesticides, and agricultural chemicals to cooperatives and farms.",
        "We supply chemical products and fertilizers to farms and agricultural businesses.",
        "Wholesale distributor of fertilizers and agrochemicals to farmers and cooperatives.",
        "Nag-su-supply kami ng pataba at pesticides sa mga farms at agricultural cooperatives.",
        "Bulk supplier of industrial chemicals and agricultural inputs.",
    ],
    ("FDS", "Restaurant / eatery"): [
        "We run a karinderia that serves rice meals, ulam, and merienda to students and workers near the school.",
        "I run a small eatery that serves rice meals and Filipino dishes.",
        "Restaurant serving Filipino food — adobo, sinigang, lechon kawali.",
        "May karinderia kami na nagluluto ng mga ulam at kanin para sa mga workers.",
        "Eatery near the market selling breakfast and lunch meals at affordable prices.",
    ],
    ("FDS", "Catering services"): [
        "Nag-ooffer kami ng catering para sa kasal, birthday, at corporate events — full package from menu to service.",
        "We provide catering services for events like weddings, birthdays, and corporate functions.",
        "Catering business for debuts, baptisms, and company events.",
        "Nag-cacater kami sa mga handaan, kasalan, at mga party — full package.",
        "Full-service catering: menu planning, cooking, and serving for events.",
    ],
    ("FDS", "Food cart / food stall"): [
        "Food stall sa tabi ng eskuwelahan na nagbebenta ng fishball, kikiam, at juice.",
        "I sell street food from a cart — fishballs, kwek-kwek, and isaw.",
        "May food cart ako na nagbebenta ng fishball, kikiam, at hotdog.",
        "Street food stall selling turon, banana cue, and drinks near the terminal.",
        "Food cart offering taho, lugaw, and merienda items in the plaza.",
    ],
    ("FDS", "Bakery / pastry shop"): [
        "Panaderia na nagluluto ng pandesal, ensaymada, cake, at pastries araw-araw.",
        "I own a bakery that bakes and sells pandesal, cakes, and pastries.",
        "May panaderia kami na nagluluto ng pandesal, ensaymada, at mga cake.",
        "Bakery selling bread, cookies, and custom cakes for occasions.",
        "Pastry shop with pandesal, pan de coco, and birthday cakes.",
    ],
    ("FDS", "Coffee shop / milk tea"): [
        "Coffee shop na nagbebenta ng kapé, milk tea, at light meals; may WiFi para sa mga nag-aaral at nagtratrabaho.",
        "I own a coffee shop that also sells milk tea, frappe, and light snacks.",
        "May milk tea at coffee shop kami, nagbebenta din ng pastries at snacks.",
        "Cafe offering brewed coffee, iced drinks, and sandwiches; study-friendly.",
        "Milk tea and coffee stand near the university with takeout and dine-in.",
    ],
    ("FDS", "Bar / nightclub"): [
        "Bar na may live band at nagbebenta ng beer, cocktails, at pulutan.",
        "I run a bar and nightclub that serves alcoholic beverages with live entertainment.",
        "Bar serving beer, cocktails, and pulutan with videoke and live band.",
        "Nightclub with DJ, drinks, and party events on weekends.",
        "Beer house na nagbebenta ng bottled beer at pulutan para sa barkada.",
    ],
    ("FDS", "Canteen / commissary"): [
        "Canteen sa loob ng opisina na nagse-serve ng lunch meals at merienda sa mga empleyado.",
        "I operate a canteen inside a school that serves meals to students and staff.",
        "Company canteen serving breakfast, lunch, and snacks to employees.",
        "Canteen sa loob ng factory para sa mga workers — rice meals at merienda.",
        "School canteen offering affordable meals and snacks to students.",
    ],
    ("MFG", "Food processing"): [
        "We process and pack dried fish, danggit, and chicharon for distribution to markets.",
        "I process and package food products like dried fish, chips, and canned goods.",
        "Food processing: making bagoong, vinegar, and bottled sauces for retail.",
        "Nagpo-process kami ng dried fish at chicharon para ibenta sa palengke.",
        "Small factory processing fruits into jams and bottled drinks.",
    ],
    ("MFG", "Garments & textiles"): [
        "Gumagawa kami ng uniforms, t-shirts, at workwear para sa mga kumpanya at school.",
        "We manufacture uniforms, t-shirts, and workwear for companies and schools.",
        "Garment factory producing school uniforms and corporate wear.",
        "Nagse-sew kami ng uniforms, PE shirts, at promotional wear.",
        "Textile and garment manufacturing for local and export orders.",
    ],
    ("MFG", "Furniture & woodworks"): [
        "Custom furniture maker — tables, cabinets, and wooden fixtures for homes and offices.",
        "We make custom furniture: tables, cabinets, and wooden fixtures for homes and offices.",
        "Woodworking shop: chairs, beds, and custom cabinetry.",
        "Nagfa-fabricate kami ng wooden furniture at office fixtures.",
        "Furniture manufacturer for residential and office use — tables, shelves, desks.",
    ],
    ("MFG", "Metal fabrication"): [
        "Nagfa-fabricate kami ng steel gates, window grills, at metal structures para sa residential at commercial.",
        "We fabricate steel gates, window grills, and metal structures for residential and commercial.",
        "Metal workshop making gates, railings, and steel furniture.",
        "Fabrication ng steel doors, window grills, at metal cabinets.",
        "Custom metal works: signage, frames, and structural steel.",
    ],
    ("MFG", "Plastics & rubber products"): [
        "We manufacture plastic bags, containers, and rubber products for local and export market.",
        "Plastic manufacturing: bags, containers, and household plastic products.",
        "Nagpo-produce kami ng plastic bags, straws, at food containers.",
        "Rubber and plastic products for industrial and consumer use.",
        "Factory making plastic bottles, caps, and packaging materials.",
    ],
    ("MFG", "Printing & publishing"): [
        "Printing shop na nagpi-print ng tarpaulin, calling cards, brochure, at mga publication.",
        "We run a printing shop for tarpaulin, business cards, and brochures.",
        "Printing services: tarp, stickers, and short-run publications.",
        "Nagpi-print kami ng invitations, posters, at company materials.",
        "Print and design shop for flyers, manuals, and marketing collaterals.",
    ],
    ("MFG", "Chemical products"): [
        "Gumagawa kami ng sabon, detergent, at mga cleaning chemicals para sa household at industrial.",
        "We manufacture soap, detergent, and cleaning chemicals for household and industrial use.",
        "Chemical products: liquid soap, bleach, and cleaning solutions.",
        "Nagpo-produce kami ng dishwashing liquid, laundry soap, at disinfectants.",
        "Small-scale production of candles and basic chemical household products.",
    ],
    ("MFG", "Electronics assembly"): [
        "We assemble electronic components and circuit boards for export and local OEM clients.",
        "Electronics assembly: wiring harnesses and simple electronic devices.",
        "Nag-a-assemble kami ng small appliances at electronic gadgets.",
        "Assembly of LED lights, power supplies, and electronic modules.",
        "Contract assembly for local brands — chargers, cables, and small devices.",
    ],
    ("MFG", "Fireworks / pyrotechnics"): [
        "Manufacturer ng paputok at pyrotechnics para sa New Year at mga events; may permit from PNP.",
        "We manufacture fireworks and pyrotechnics for New Year and events; PNP permitted.",
        "Licensed fireworks producer for festivals and celebrations.",
        "Nagpo-produce kami ng safe pyrotechnics para sa events at New Year.",
        "Fireworks manufacturing with proper permits for legal sale.",
    ],
    ("SVC", "Salon / barbershop"): [
        "Parlor na nag-ooffer ng haircut, rebond, manicure, at pedicure para sa babae at lalaki.",
        "We offer haircut, rebond, manicure, and pedicure for men and women.",
        "Barbershop for gupit and beard trim; unisex salon next door.",
        "Beauty salon: haircare, nail care, and basic facial.",
        "Nag-ooffer kami ng haircut, coloring, at nail services.",
    ],
    ("SVC", "Laundry services"): [
        "Laundry shop na naglalaba, nag-dry, at nag-iiron ng damit; may pickup at delivery.",
        "We run a laundry shop: wash, dry, and iron; pickup and delivery available.",
        "Laundry and dry-cleaning for households and offices.",
        "Nagla-laundry kami ng uniforms, beddings, at regular clothes.",
        "Self-service laundry with optional wash-dry-fold service.",
    ],
    ("SVC", "Repair shop (electronics, appliances)"): [
        "We repair cellphones, laptops, and appliances — screen replacement, battery, and troubleshooting.",
        "Repair shop for phones, laptops, and appliances — screen, battery, and software.",
        "Nagre-repair kami ng cellphone, laptop, at mga appliances.",
        "Electronics and appliance repair: TV, refrigerator, and aircon service.",
        "Cellphone and gadget repair — screen, charging port, and software.",
    ],
    ("SVC", "Tutorial / review center"): [
        "Review center para sa board exam at entrance test; may weekend at weeknight classes.",
        "We offer tutorial and review classes for board exams and entrance tests.",
        "Tutorial center for grade school and high school subjects.",
        "Nag-ooffer kami ng review classes para sa nursing at engineering board exams.",
        "Tutorial services for math, science, and English; weekend and summer classes.",
    ],
    ("SVC", "IT / BPO services"): [
        "IT company na nag-ooffer ng software development, BPO, at tech support services.",
        "We provide software development, BPO, and tech support services.",
        "IT solutions: web development, mobile apps, and managed services.",
        "Nag-ooffer kami ng software development at outsourcing services.",
        "BPO and call center services for overseas and local clients.",
    ],
    ("SVC", "Legal services"): [
        "Abogado na nag-ooffer ng legal consultation, notary, at representation sa court.",
        "We offer legal consultation, notary, and court representation.",
        "Law office: family law, property, and business legal services.",
        "Nag-ooffer kami ng legal advice, notary public, at document preparation.",
        "Legal services for contracts, land titles, and litigation.",
    ],
    ("SVC", "Accounting / bookkeeping"): [
        "Bookkeeping at accounting services para sa maliliit na negosyo — BIR, payroll, at financial reports.",
        "We provide bookkeeping and accounting for small businesses — BIR, payroll, and reports.",
        "Accounting services: tax filing, financial statements, and payroll.",
        "Nag-a-assist kami sa BIR compliance, bookkeeping, at payroll.",
        "CPA firm offering audit, tax, and business advisory.",
    ],
    ("SVC", "Medical / dental clinic"): [
        "Clinic na nag-ooffer ng general check-up, vaccinations, at minor procedures.",
        "We run a medical and dental clinic — check-ups, vaccinations, and minor procedures.",
        "General practice clinic with basic lab and vaccination services.",
        "Dental clinic: cleaning, extraction, and simple restorative work.",
        "Nag-ooffer kami ng check-up, vaccination, at primary care consultations.",
    ],
    ("SVC", "Veterinary clinic"): [
        "Veterinary clinic para sa aso, pusa, at iba pang hayop — vaccination, deworming, at surgery.",
        "We operate a veterinary clinic for dogs, cats, and other animals — vaccination and surgery.",
        "Vet clinic: vaccination, deworming, and minor surgery for pets.",
        "Nag-ooffer kami ng vet services: vaccination, grooming, at emergency care.",
        "Animal clinic for livestock and pet health services.",
    ],
    ("SVC", "Security agency"): [
        "We provide security guards and security systems for buildings, events, and establishments.",
        "Security agency na nagde-deploy ng guards sa buildings, events, at establishments.",
        "We deploy security personnel and install CCTV and access control.",
        "Nag-supply kami ng security guards sa mga offices at commercial buildings.",
        "Security services for events, construction sites, and offices.",
    ],
    ("SVC", "Manpower / recruitment agency"): [
        "Recruitment agency na nagde-deploy ng workers locally at overseas; may placement fee.",
        "We deploy workers locally and overseas; placement fee applies.",
        "Manpower agency for factory, construction, and household workers.",
        "Nagre-recruit kami ng workers para sa local at overseas employment.",
        "Recruitment and placement for OFW and local jobs.",
    ],
    ("SVC", "Advertising services"): [
        "Advertising agency na gumagawa ng billboards, print ads, at digital marketing campaigns.",
        "We create billboards, print ads, and digital marketing campaigns.",
        "Ad agency: branding, social media, and event marketing.",
        "Nag-ooffer kami ng print ads, tarpaulin, at digital marketing.",
        "Creative and media buying for brands and SMEs.",
    ],
    ("FIN", "Lending / financing company"): [
        "Nagpapautang kami ng pera sa mga indibidwal at maliliit na negosyo; may simple interest at flexible terms.",
        "We lend to individuals and small businesses with simple interest and flexible terms.",
        "Lending company offering personal and business loans.",
        "Nag-ooffer kami ng salary loan at business loan sa mga qualified borrowers.",
        "Financing for motorcycles, appliances, and small business capital.",
    ],
    ("FIN", "Pawnshop"): [
        "Sanglaan na tumatanggap ng alahas, gadgets, at iba pang may halaga bilang collateral; may monthly interest.",
        "We accept jewelry, gadgets, and valuables as collateral; monthly interest applies.",
        "Pawnshop with multiple branches for quick loans against items.",
        "Nag-a-accept kami ng sangla ng alahas, cellphone, at appliances.",
        "Pawnshop offering appraisals and loans on gold and electronics.",
    ],
    ("FIN", "Money changer / remittance"): [
        "Remittance center kung saan pwedeng magpadala at tumanggap ng pera mula sa OFW.",
        "We operate a remittance center for sending and receiving money from OFWs.",
        "Money transfer and foreign exchange services for OFW families.",
        "Nag-ooffer kami ng remittance at currency exchange services.",
        "Remittance partner of major international money transfer companies.",
    ],
    ("FIN", "Insurance agency"): [
        "We sell life insurance, health insurance, and non-life policies as an accredited agent.",
        "Insurance agency selling life, health, and non-life policies.",
        "Nagbebenta kami ng life insurance, health insurance, at non-life policies.",
        "Accredited agent for life and general insurance products.",
        "Insurance brokerage for individuals and group plans.",
    ],
    ("FIN", "Cooperative (credit)"): [
        "Kooperatiba na nag-ooffer ng savings, loans, at other financial services sa mga miyembro.",
        "We are a credit cooperative offering savings, loans, and financial services to members.",
        "Cooperative with savings, multi-purpose loans, and member benefits.",
        "Nag-ooffer kami ng savings, loan, at burial assistance sa mga miyembro.",
        "Credit cooperative for employees and community members.",
    ],
    ("FIN", "Microfinance institution"): [
        "Microfinance na nagpapautang sa mga nanay at maliliit na negosyante sa barangay.",
        "We provide microloans to mothers and small entrepreneurs in the community.",
        "Microfinance lending with group and individual loans.",
        "Nagpapautang kami ng maliit na capital sa mga sari-sari store at palengke vendors.",
        "Microfinance with weekly collection and livelihood training.",
    ],
    ("RES", "Real estate brokerage"): [
        "Real estate broker — tumutulong sa pagbili, pagbenta, at pag-renta ng lupa at bahay.",
        "We help with buying, selling, and renting land and houses.",
        "Real estate brokerage for residential and commercial properties.",
        "Nag-a-assist kami sa pagbili at pagbenta ng lupa at bahay.",
        "Property broker for house-and-lot and lot-only sales.",
    ],
    ("RES", "Property leasing / rental"): [
        "We lease commercial and residential spaces to tenants; may monthly at yearly contract.",
        "Property leasing for commercial and residential — monthly and yearly contracts.",
        "Nagpa-rent kami ng commercial spaces sa mga negosyante.",
        "We rent out office spaces and retail spaces to businesses.",
        "Leasing of warehouse and office spaces in the industrial park.",
    ],
    ("RES", "Subdivision developer"): [
        "Developer ng subdivision — nagbebenta ng house-and-lot at lot only sa mga buyers.",
        "We develop subdivisions and sell house-and-lot and lot-only units.",
        "Subdivision developer with affordable housing packages.",
        "Nagbebenta kami ng house-and-lot sa aming developed subdivision.",
        "Real estate developer with ongoing subdivision projects.",
    ],
    ("RES", "Boarding house / dormitory"): [
        "Boarding house para sa mga estudyante at workers malapit sa university at industrial area.",
        "We run a boarding house for students and workers near the university.",
        "Dormitory with rooms for students and single workers.",
        "Nagpa-rent kami ng rooms sa mga estudyante at workers — may common kitchen.",
        "Boarding house with monthly rent and basic utilities included.",
    ],
    ("RES", "Apartment / condominium rental"): [
        "Nagpa-rent kami ng apartment at condominium units by month or year.",
        "We rent out apartment and condominium units by month or year.",
        "Apartment rental for families and professionals; flexible terms.",
        "Condominium units for rent — furnished and unfurnished.",
        "Nag-ooffer kami ng apartment rental malapit sa business district.",
    ],
    ("TRN", "Trucking / hauling"): [
        "Trucking company na naghahatid ng mga goods at raw materials sa mga factory at construction sites.",
        "We haul goods and raw materials to factories and construction sites.",
        "Trucking services for bulk delivery of construction and agricultural goods.",
        "Nagha-hatid kami ng cargo by truck sa mga provinces at warehouses.",
        "Freight trucking for manufacturers and distributors.",
    ],
    ("TRN", "Passenger transport (jeepney, bus, UV express)"): [
        "We operate jeepneys and UV express units on fixed routes in the city and nearby towns.",
        "Jeepney and UV express operator on city and provincial routes.",
        "Nag-ooperate kami ng jeepney at UV express sa mga fixed routes.",
        "Bus company serving provincial routes and city terminals.",
        "UV express and van rental for group travel.",
    ],
    ("TRN", "Delivery / courier service"): [
        "Courier at delivery service para sa parcels, documents, at food within the city at nearby areas.",
        "We deliver parcels, documents, and food within the city and nearby areas.",
        "Same-day and next-day delivery for online sellers and businesses.",
        "Nagde-deliver kami ng parcels, documents, at food orders.",
        "Courier and last-mile delivery for e-commerce and restaurants.",
    ],
    ("TRN", "Freight forwarding"): [
        "Freight forwarding — nag-aarrange ng shipping ng cargo by land, sea, at air.",
        "We arrange shipping of cargo by land, sea, and air.",
        "Freight forwarder for export and import documentation and logistics.",
        "Nag-aarrange kami ng sea freight at air freight for businesses.",
        "Logistics and customs brokerage for international shipments.",
    ],
    ("TRN", "Warehouse / storage"): [
        "Warehouse na nag-ooffer ng storage at inventory management para sa mga negosyo.",
        "We offer warehouse storage and inventory management for businesses.",
        "Cold storage and dry warehouse for food and goods.",
        "Nag-ooffer kami ng storage space at pallet handling for distributors.",
        "Warehouse with loading dock and inventory management services.",
    ],
    ("TRN", "Parking lot operation"): [
        "Paid parking lot sa downtown para sa mga motor at sasakyan; may daily at monthly rate.",
        "We operate a paid parking lot for motorcycles and cars — daily and monthly rates.",
        "Parking facility near the mall and offices.",
        "Nag-ooperate kami ng parking lot para sa mga commuters at employees.",
        "Secure parking with daily and monthly passes for cars and motorcycles.",
    ],
    ("AGR", "Crop farming"): [
        "Nagtatanim kami ng palay, mais, at gulay sa aming bukid para ibenta sa palengke.",
        "We grow rice, corn, and vegetables on our farm for market sale.",
        "Crop farming: palay, corn, and high-value vegetables.",
        "Nagfa-farm kami ng rice at vegetables for local market.",
        "Organic vegetable and rice farming for direct and market sale.",
    ],
    ("AGR", "Livestock / poultry raising"): [
        "We raise pigs, chickens, and ducks for meat and egg production; may small feedlot.",
        "Livestock and poultry: pigs, chickens, ducks for meat and eggs.",
        "Nag-aalaga kami ng manok para sa eggs at meat; may small piggery din.",
        "Poultry farm supplying eggs and dressed chicken to markets.",
        "Small-scale piggery and poultry for local buyers.",
    ],
    ("AGR", "Aquaculture / fishpond"): [
        "Fishpond na nag-aalaga ng tilapia at bangus para ibenta sa palengke at restaurants.",
        "We operate a fishpond raising tilapia and bangus for market and restaurants.",
        "Aquaculture: tilapia, bangus, and shrimp in freshwater ponds.",
        "Nag-aalaga kami ng tilapia at bangus sa fishpond para ibenta.",
        "Fish farm with hatchery and grow-out for local sale.",
    ],
    ("AGR", "Plant nursery"): [
        "Nursery na nagbebenta ng ornamental plants, seedlings, at garden supplies.",
        "We run a plant nursery selling ornamental plants, seedlings, and garden supplies.",
        "Nursery with fruit tree seedlings and ornamental plants.",
        "Nagbebenta kami ng seedlings, potting mix, at garden tools.",
        "Plant nursery for landscaping and home gardening.",
    ],
    ("AGR", "Rice / corn milling"): [
        "Rice mill na gumagiling ng palay para maging bigas; nagbebenta kami ng wholesale at retail.",
        "We operate a rice mill — palay to bigas; wholesale and retail.",
        "Rice and corn milling for local farmers and traders.",
        "Nagga-giling kami ng palay at mais para sa mga farmers at buyers.",
        "Rice mill with drying and storage for farmers.",
    ],
    ("AGR", "Agricultural services (spraying, harvesting)"): [
        "Nag-ooffer kami ng spraying, harvesting, at land preparation services sa mga farmers.",
        "We offer spraying, harvesting, and land preparation services to farmers.",
        "Agricultural services: tractor rental, harvesting, and post-harvest.",
        "Nag-a-assist kami sa spraying, threshing, at land prep.",
        "Custom harvesting and machinery rental for rice and corn.",
    ],
    ("CON", "General contractor"): [
        "General contractor — nagpa-patayo ng bahay, building, at road construction.",
        "We build houses, buildings, and road construction as general contractor.",
        "General construction: residential, commercial, and infrastructure.",
        "Nagpa-patayo kami ng bahay, building, at road projects.",
        "Licensed contractor for building and civil works.",
    ],
    ("CON", "Specialty trade contractor"): [
        "Specialty contractor para sa tile, flooring, at finishing works sa residential at commercial.",
        "We do tile, flooring, and finishing for residential and commercial.",
        "Specialty trades: tiling, flooring, and interior finishing.",
        "Nag-i-install kami ng tiles, vinyl flooring, at ceiling works.",
        "Subcontractor for flooring, painting, and carpentry.",
    ],
    ("CON", "Electrical installation"): [
        "Electrical contractor — installation ng wiring, panel, at lighting sa bahay at building.",
        "We install wiring, panel, and lighting for houses and buildings.",
        "Licensed electrical contractor for residential and commercial.",
        "Nag-i-install kami ng electrical system at lighting sa mga projects.",
        "Electrical works: design, installation, and maintenance.",
    ],
    ("CON", "Plumbing & HVAC"): [
        "Plumbing at HVAC installation para sa residential at commercial projects.",
        "We do plumbing and HVAC installation for residential and commercial.",
        "Plumbing contractor: water lines, septic, and drainage.",
        "Nag-i-install kami ng plumbing at aircon sa bahay at building.",
        "HVAC and plumbing for new construction and renovation.",
    ],
    ("CON", "Painting & finishing"): [
        "Painting contractor — interior at exterior painting, waterproofing, at finishing.",
        "We do interior and exterior painting, waterproofing, and finishing.",
        "Painting services for houses, buildings, and industrial.",
        "Nagpi-paint kami ng interior, exterior, at waterproofing.",
        "Commercial and residential painting and coating.",
    ],
    ("CON", "Demolition services"): [
        "Demolition services — paggiba ng lumang building at structure; may proper permits.",
        "We provide demolition services for old buildings and structures; with permits.",
        "Demolition and site clearing with proper permits.",
        "Nagga-giba kami ng lumang structures; may safety at permits.",
        "Demolition contractor for buildings and concrete structures.",
    ],
    ("MIN", "Sand & gravel quarrying"): [
        "Quarry ng buhangin at gravel para ibenta sa mga contractor at construction.",
        "We operate a sand and gravel quarry for contractors and construction.",
        "Sand and gravel extraction and supply for construction.",
        "Nagbebenta kami ng buhangin at gravel from our quarry.",
        "Quarry operations with proper permits for sand and gravel.",
    ],
    ("MIN", "Stone quarrying"): [
        "We extract and sell stone and rocks for building foundations and road construction.",
        "Stone quarrying for building stone and aggregates.",
        "Nagpo-produce kami ng crushed stone at boulders for construction.",
        "Quarry of dimension stone and crushed stone for infrastructure.",
        "Stone extraction and crushing for concrete and road base.",
    ],
    ("MIN", "Non-metallic mineral mining"): [
        "Mining ng non-metallic minerals para sa industrial at construction use.",
        "We mine non-metallic minerals for industrial and construction use.",
        "Extraction of limestone, clay, and other non-metallic minerals.",
        "Nagmi-mine kami ng non-metallic minerals for cement at industrial.",
        "Quarry and mineral extraction with government permits.",
    ],
    ("UTL", "Water distribution"): [
        "Water refilling station na nagbebenta ng purified drinking water sa mga container at bottles.",
        "We sell purified drinking water at our refilling station — containers and bottles.",
        "Water refilling station with 5-gallon and bottled water.",
        "Nagbebenta kami ng purified water sa refilling station.",
        "Drinking water purification and distribution in the barangay.",
    ],
    ("UTL", "Electric power distribution"): [
        "We distribute electric power to households and small businesses in the barangay.",
        "Electric power distribution to households and small businesses.",
        "Distribution utility or sub-distribution for a barangay or subdivision.",
        "Nagdi-distribute kami ng kuryente sa mga households sa area.",
        "Small-scale power distribution or generator rental.",
    ],
    ("UTL", "Waste collection & disposal"): [
        "Waste collection at recycling — nagko-collect kami ng basura at nagbebenta ng recyclables.",
        "We collect waste and sell recyclables; waste collection and disposal.",
        "Garbage collection and recycling services for barangays and businesses.",
        "Nagko-collect kami ng basura at nagre-recycle ng plastics at paper.",
        "Solid waste collection and materials recovery facility.",
    ],
    ("UTL", "Sewerage services"): [
        "Septic tank cleaning at sewerage services para sa residential at commercial.",
        "We provide septic tank cleaning and sewerage services for residential and commercial.",
        "Septic and sewer cleaning with vacuum trucks.",
        "Nagli-linis kami ng septic tank at sewer lines.",
        "Sewerage and septic maintenance for subdivisions and commercial.",
    ],
}

def main():
    lobs = load_lobs()
    entries = []
    for lob in lobs:
        key = (lob["taxCode"], lob["detailedLine"])
        rec = {k: lob[k] for k in ("taxCode", "lineOfBusiness", "detailedLine", "psicCode")}
        variants = VARIANTS.get(key)
        if not variants:
            entries.append({
                "businessDescription": f"Business related to {lob['detailedLine']} ({lob['taxCode']}).",
                "recommendations": [rec],
            })
            continue
        for desc in variants:
            entries.append({
                "businessDescription": desc,
                "recommendations": [rec],
            })
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(entries)} entries to {OUT_PATH}")

if __name__ == "__main__":
    main()
