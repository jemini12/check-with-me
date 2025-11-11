-- Seed initial trending prompts with diverse fact-check examples

INSERT INTO trending_prompts (prompt, cached_result, upvote_count) VALUES
-- Science & Nature
(
  'Humans share 50% of their DNA with bananas',
  '{"original_text":"Humans share 50% of their DNA with bananas","fact_checks":[{"claim":"Humans share 50% of their DNA with bananas","is_accurate":true,"confidence":0.92,"reason":"Scientific research confirms that humans share approximately 50-60% of their DNA with bananas. This is because all living organisms share common ancestry and many basic cellular functions require similar genes.","correction":null,"start":0,"end":43,"sources":[{"url":"https://www.genome.gov/genetics-glossary/Deoxyribonucleic-Acid","title":"DNA Basics - Genome.gov","snippet":"Humans share about 50% of our DNA with bananas due to common evolutionary origins."}]}]}',
  0
),
(
  'Lightning is hotter than the surface of the sun',
  '{"original_text":"Lightning is hotter than the surface of the sun","fact_checks":[{"claim":"Lightning is hotter than the surface of the sun","is_accurate":true,"confidence":0.95,"reason":"Lightning bolts can reach temperatures of approximately 30,000 Kelvin (53,540°F), which is about five times hotter than the surface of the sun at 5,800 Kelvin (9,980°F).","correction":null,"start":0,"end":47,"sources":[{"url":"https://www.weather.gov/safety/lightning-temperature","title":"Lightning Temperature - NOAA","snippet":"Lightning can heat the air it passes through to 50,000 degrees Fahrenheit, five times hotter than the surface of the sun."}]}]}',
  0
),
(
  'Water boils at 100 degrees Celsius everywhere',
  '{"original_text":"Water boils at 100 degrees Celsius everywhere","fact_checks":[{"claim":"Water boils at 100 degrees Celsius everywhere","is_accurate":false,"confidence":0.96,"reason":"Water boils at 100°C only at sea level (standard atmospheric pressure). At higher altitudes where air pressure is lower, water boils at lower temperatures. For example, at the top of Mount Everest, water boils at about 71°C.","correction":"Water boils at 100°C only at sea level. The boiling point decreases at higher altitudes due to lower atmospheric pressure.","start":0,"end":46,"sources":[{"url":"https://www.usgs.gov/special-topics/water-science-school/science/boiling-point-water","title":"Boiling Point of Water - USGS","snippet":"The boiling point of water varies with atmospheric pressure. At sea level it is 212°F (100°C), but at higher elevations it is lower."}]}]}',
  0
),

-- Health & Medicine
(
  'You need to drink 8 glasses of water per day',
  '{"original_text":"You need to drink 8 glasses of water per day","fact_checks":[{"claim":"You need to drink 8 glasses of water per day","is_accurate":false,"confidence":0.88,"reason":"The \"8 glasses a day\" rule is a myth with no scientific basis. Fluid needs vary greatly by individual, activity level, climate, and diet. The body regulates hydration naturally through thirst. Many foods also contain water.","correction":"There is no universal requirement for 8 glasses of water daily. Hydration needs vary by individual and circumstances.","start":0,"end":46,"sources":[{"url":"https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256","title":"Water: How much should you drink? - Mayo Clinic","snippet":"The 8x8 rule is not supported by hard evidence. Individual water needs vary."}]}]}',
  0
),
(
  'Eating carrots improves night vision',
  '{"original_text":"Eating carrots improves night vision","fact_checks":[{"claim":"Eating carrots improves night vision","is_accurate":false,"confidence":0.91,"reason":"This is a myth that originated from British WWII propaganda. While carrots contain vitamin A which is essential for eye health, eating them does not enhance night vision beyond normal levels. The myth was created to hide radar technology from the Germans.","correction":"Carrots provide vitamin A for eye health but do not improve night vision beyond normal levels. This was WWII propaganda.","start":0,"end":37,"sources":[{"url":"https://www.smithsonianmag.com/arts-culture/a-wwii-propaganda-campaign-popularized-the-myth-that-carrots-help-you-see-in-the-dark-28812484/","title":"Carrot Vision Myth - Smithsonian","snippet":"The myth about carrots and night vision was British wartime propaganda to explain how pilots spotted enemy planes at night."}]}]}',
  0
),
(
  'Your blood is blue before it hits oxygen',
  '{"original_text":"Your blood is blue before it hits oxygen","fact_checks":[{"claim":"Your blood is blue before it hits oxygen","is_accurate":false,"confidence":0.98,"reason":"This is a complete myth. Blood is never blue. Deoxygenated blood is dark red, while oxygenated blood is bright red. Veins appear blue through the skin due to how light penetrates and reflects through tissue, not because the blood itself is blue.","correction":"Blood is always red. Deoxygenated blood is dark red, not blue. Veins appear blue due to light refraction through skin.","start":0,"end":41,"sources":[{"url":"https://www.britannica.com/story/is-blood-ever-blue","title":"Is Blood Ever Blue? - Britannica","snippet":"Blood is never blue. It appears blue in veins due to the way light interacts with skin, but the blood itself is always red."}]}]}',
  0
),

-- History & Culture
(
  'Vikings wore horned helmets',
  '{"original_text":"Vikings wore horned helmets","fact_checks":[{"claim":"Vikings wore horned helmets","is_accurate":false,"confidence":0.96,"reason":"This is a myth popularized by 19th-century opera and art. Archaeological evidence shows Vikings never wore horned helmets in battle. The horned helmet image comes from ceremonial Bronze Age helmets that predate Vikings by thousands of years.","correction":"Vikings did not wear horned helmets. This is a 19th-century myth with no archaeological support.","start":0,"end":27,"sources":[{"url":"https://www.history.com/news/did-vikings-really-wear-horned-helmets","title":"Viking Helmets - History.com","snippet":"There is no evidence that Vikings wore horned helmets. This myth came from 19th-century Scandinavian artists."}]}]}',
  0
),
(
  'The Great Wall of China was built in a single dynasty',
  '{"original_text":"The Great Wall of China was built in a single dynasty","fact_checks":[{"claim":"The Great Wall of China was built in a single dynasty","is_accurate":false,"confidence":0.94,"reason":"The Great Wall was built over approximately 2,000 years by multiple dynasties. Construction began in the 7th century BC, with the most famous sections built during the Ming Dynasty (1368-1644 AD). Various dynasties added, rebuilt, and maintained different sections.","correction":"The Great Wall was built over 2,000 years by multiple dynasties, not a single one. The Ming Dynasty built the most famous sections.","start":0,"end":54,"sources":[{"url":"https://www.britannica.com/topic/Great-Wall-of-China","title":"Great Wall of China - Britannica","snippet":"The Great Wall was built over many centuries by successive Chinese dynasties and states."}]}]}',
  0
),

-- Technology & Modern Life
(
  'Airplane mode prevents all phone radiation',
  '{"original_text":"Airplane mode prevents all phone radiation","fact_checks":[{"claim":"Airplane mode prevents all phone radiation","is_accurate":false,"confidence":0.89,"reason":"Airplane mode disables cellular, Wi-Fi, and Bluetooth radio signals, which significantly reduces RF radiation. However, the phone still emits some low-level radiation from its processor and other electronic components. It is not zero radiation.","correction":"Airplane mode significantly reduces but does not eliminate all radiation from a phone. Electronic components still emit low-level radiation.","start":0,"end":43,"sources":[{"url":"https://www.fcc.gov/consumers/guides/wireless-devices-and-health-concerns","title":"Wireless Devices and Health - FCC","snippet":"Airplane mode disables transmitting functions but the device still operates and emits some electromagnetic fields."}]}]}',
  0
),
(
  'Incognito mode makes you completely anonymous online',
  '{"original_text":"Incognito mode makes you completely anonymous online","fact_checks":[{"claim":"Incognito mode makes you completely anonymous online","is_accurate":false,"confidence":0.97,"reason":"Incognito/private mode only prevents local browsing history storage. Your ISP, websites you visit, network administrators, and government agencies can still track your activity. It does not hide your IP address or provide true anonymity.","correction":"Incognito mode only hides local browsing history. Your ISP, websites, and network can still track you. Use a VPN for better privacy.","start":0,"end":53,"sources":[{"url":"https://support.google.com/chrome/answer/95464","title":"Browse in private - Chrome Help","snippet":"Incognito mode does not make you anonymous. Your activity might still be visible to websites, employers, schools, or ISP."}]}]}',
  0
),

-- Food & Nutrition
(
  'MSG is dangerous and causes health problems',
  '{"original_text":"MSG is dangerous and causes health problems","fact_checks":[{"claim":"MSG is dangerous and causes health problems","is_accurate":false,"confidence":0.93,"reason":"Scientific research has repeatedly found that MSG (monosodium glutamate) is safe for consumption. The FDA classifies it as GRAS (Generally Recognized As Safe). Claims of \"Chinese Restaurant Syndrome\" lack scientific support in controlled studies.","correction":"MSG is scientifically proven safe and approved by health authorities worldwide. Claims of danger lack scientific evidence.","start":0,"end":44,"sources":[{"url":"https://www.fda.gov/food/food-additives-petitions/questions-and-answers-monosodium-glutamate-msg","title":"MSG Safety - FDA","snippet":"MSG is generally recognized as safe. A controlled study found no consistent adverse responses to MSG."}]}]}',
  0
),
(
  'Sugar makes children hyperactive',
  '{"original_text":"Sugar makes children hyperactive","fact_checks":[{"claim":"Sugar makes children hyperactive","is_accurate":false,"confidence":0.91,"reason":"Multiple double-blind studies have found no causal link between sugar consumption and hyperactivity in children. The belief persists due to parental expectations and the contexts in which children eat sugar (parties, holidays). Behavior is influenced by excitement, not sugar itself.","correction":"Scientific studies show sugar does not cause hyperactivity in children. This is a persistent myth not supported by evidence.","start":0,"end":33,"sources":[{"url":"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1119465/","title":"Sugar and Hyperactivity - NIH","snippet":"Meta-analysis of studies found no significant effects of sugar on children behavior or cognitive performance."}]}]}',
  0
),

-- Animals & Biology
(
  'Ostriches bury their heads in sand when scared',
  '{"original_text":"Ostriches bury their heads in sand when scared","fact_checks":[{"claim":"Ostriches bury their heads in sand when scared","is_accurate":false,"confidence":0.95,"reason":"This is a complete myth. Ostriches do not bury their heads in sand. When threatened, they either run away at high speeds (up to 45 mph) or lie flat with their necks outstretched. They dig holes in sand for their eggs, which may have led to this misconception.","correction":"Ostriches do not bury their heads in sand. They run away or lie flat when scared. This myth comes from their nesting behavior.","start":0,"end":46,"sources":[{"url":"https://www.loc.gov/everyday-mysteries/zoology/item/do-ostriches-really-bury-their-heads-in-the-sand/","title":"Ostrich Myth - Library of Congress","snippet":"No, ostriches do not bury their heads in sand. This myth likely arose from their ground-nesting habits."}]}]}',
  0
),
(
  'Bulls are enraged by the color red',
  '{"original_text":"Bulls are enraged by the color red","fact_checks":[{"claim":"Bulls are enraged by the color red","is_accurate":false,"confidence":0.94,"reason":"Bulls are colorblind to red. They react to the movement of the matador cape, not its color. Scientific studies confirm cattle have dichromatic vision and cannot distinguish red from other colors. The tradition of red capes is for the audience, not the bull.","correction":"Bulls are colorblind to red and react to movement, not color. Red capes are a tradition for spectators.","start":0,"end":35,"sources":[{"url":"https://www.britannica.com/story/are-bulls-really-angered-by-the-color-red","title":"Bulls and Red - Britannica","snippet":"Bulls cannot see the color red. They react to the movement of the cape, not its color."}]}]}',
  0
),

-- Space & Astronomy
(
  'The sun is yellow in color',
  '{"original_text":"The sun is yellow in color","fact_checks":[{"claim":"The sun is yellow in color","is_accurate":false,"confidence":0.90,"reason":"The sun is actually white, not yellow. It appears yellow from Earth because our atmosphere scatters blue light, making the sun look more yellow/orange. In space, astronauts see the sun as white. The sun emits all colors of light equally, which combines to appear white.","correction":"The sun is white, not yellow. It appears yellow from Earth due to atmospheric scattering of blue light.","start":0,"end":27,"sources":[{"url":"https://www.nasa.gov/feature/goddard/2020/the-sun-by-the-numbers","title":"The Sun - NASA","snippet":"The sun is white. It appears yellow due to Earths atmosphere scattering shorter wavelengths of light."}]}]}',
  0
),

-- Psychology & Brain
(
  'We only use 10% of our brains',
  '{"original_text":"We only use 10% of our brains","fact_checks":[{"claim":"We only use 10% of our brains","is_accurate":false,"confidence":0.99,"reason":"This is a complete myth. Brain imaging shows we use virtually all parts of our brain, and most of the brain is active most of the time. Even during sleep, all areas show activity. Damage to any small area can have profound effects, proving all areas are functional.","correction":"We use virtually all of our brain. Brain scans show most of the brain is active throughout the day.","start":0,"end":30,"sources":[{"url":"https://www.scientificamerican.com/article/do-people-only-use-10-percent-of-their-brains/","title":"10% Brain Myth - Scientific American","snippet":"Neurological studies show humans use much more than 10% of their brains. We use virtually all of it."}]}]}',
  0
),

-- Law & Society
(
  'You must wait 24 hours to report a missing person',
  '{"original_text":"You must wait 24 hours to report a missing person","fact_checks":[{"claim":"You must wait 24 hours to report a missing person","is_accurate":false,"confidence":0.97,"reason":"This is a dangerous myth. Police accept missing person reports immediately. The first few hours are critical in missing person cases. There is no waiting period required by law. This myth may come from TV shows and movies.","correction":"There is no 24-hour waiting period to report a missing person. Report immediately - early hours are critical.","start":0,"end":50,"sources":[{"url":"https://www.fbi.gov/file-repository/missing-persons-myths.pdf","title":"Missing Persons Myths - FBI","snippet":"You do not have to wait 24 hours to report a person missing. Prompt reporting is critical."}]}]}',
  0
),

-- Physics & Math
(
  'A penny dropped from the Empire State Building can kill someone',
  '{"original_text":"A penny dropped from the Empire State Building can kill someone","fact_checks":[{"claim":"A penny dropped from the Empire State Building can kill someone","is_accurate":false,"confidence":0.92,"reason":"This is a myth. A penny would not kill someone due to its low mass and the air resistance it encounters. It would reach a terminal velocity of about 30-50 mph, which could hurt or sting but not kill. The flat shape creates significant drag.","correction":"A falling penny cannot kill someone. Air resistance limits its speed to 30-50 mph, which would only cause minor injury at most.","start":0,"end":64,"sources":[{"url":"https://www.scientificamerican.com/article/could-a-penny-dropped-from-skyscraper-kill/","title":"Penny Drop Myth - Scientific American","snippet":"A penny dropped from a skyscraper would not kill you. Its terminal velocity is too low."}]}]}',
  0
),

-- Weather & Climate
(
  'Lightning never strikes the same place twice',
  '{"original_text":"Lightning never strikes the same place twice","fact_checks":[{"claim":"Lightning never strikes the same place twice","is_accurate":false,"confidence":0.98,"reason":"This is false. Lightning frequently strikes the same place multiple times, especially tall structures. The Empire State Building is struck about 25 times per year. Lightning rods work because lightning predictably hits high points repeatedly.","correction":"Lightning often strikes the same place multiple times. Tall structures are hit repeatedly.","start":0,"end":45,"sources":[{"url":"https://www.weather.gov/safety/lightning-myths","title":"Lightning Myths - NOAA","snippet":"Lightning definitely strikes the same place more than once, especially tall, isolated objects."}]}]}',
  0
),

-- Language & Communication
(
  'Eskimos have 50 different words for snow',
  '{"original_text":"Eskimos have 50 different words for snow","fact_checks":[{"claim":"Eskimos have 50 different words for snow","is_accurate":false,"confidence":0.89,"reason":"This is an exaggerated myth. Inuit languages have about the same number of root words for snow as English does. The number has been inflated from 2-4 to 50-100 over time. This myth demonstrates how linguistic misconceptions spread and grow.","correction":"Inuit languages have similar numbers of snow-related words as English, not 50. This is a linguistic myth that has been greatly exaggerated.","start":0,"end":41,"sources":[{"url":"https://www.smithsonianmag.com/smart-news/there-really-are-50-eskimo-words-snow-180956746/","title":"Eskimo Words for Snow - Smithsonian","snippet":"The idea that Eskimos have dozens of words for snow is largely a myth that has been debunked by linguists."}]}]}',
  0
);
