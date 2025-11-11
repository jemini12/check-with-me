import { FactCheckResponse } from './types';

/**
 * Categories for example fact-checks
 */
export type ExampleCategory = 'science' | 'health' | 'history' | 'myths' | 'politics';

/**
 * Represents a curated example fact-check with cached results
 */
export interface ExampleCheck {
  id: string;
  prompt: string;
  category: ExampleCategory;
  cachedResult: FactCheckResponse;
  initialUpvotes: number;
}

/**
 * Curated list of interesting fact-checks with pre-cached results
 * These showcase the capabilities of the fact-checker without API costs
 */
export const EXAMPLE_CHECKS: ExampleCheck[] = [
  {
    id: 'zero-calorie',
    prompt: 'Zero calorie drinks have absolutely zero calories',
    category: 'health',
    initialUpvotes: 342,
    cachedResult: {
      original_text: 'Zero calorie drinks have absolutely zero calories',
      fact_checks: [
        {
          claim: 'Zero calorie drinks have absolutely zero calories',
          start: 0,
          end: 52,
          is_accurate: false,
          confidence: 0.95,
          reason: 'Multiple independent sources confirm that zero-calorie drinks actually contain about 0.2-0.5 kcal per 100ml. They\'re labeled as "zero calorie" because regulations allow products with less than 5 kcal per 100ml to use this term, but they\'re not truly zero calories.',
          correction: 'Zero calorie drinks contain trace amounts of calories (typically less than 5 kcal per 100ml), which regulations allow to be labeled as "zero calories"',
          sources: [
            {
              url: 'https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label',
              title: 'FDA - How to Understand and Use the Nutrition Facts Label',
              snippet: 'The FDA allows products with less than 5 calories per serving to be labeled as zero calories.'
            },
            {
              url: 'https://www.healthline.com/nutrition/diet-soda-good-or-bad',
              title: 'Diet Soda: Good or Bad? - Healthline',
              snippet: 'Even though diet sodas are marketed as zero-calorie drinks, they may contain trace amounts of calories.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'great-wall',
    prompt: 'The Great Wall of China is visible from space with the naked eye',
    category: 'science',
    initialUpvotes: 298,
    cachedResult: {
      original_text: 'The Great Wall of China is visible from space with the naked eye',
      fact_checks: [
        {
          claim: 'The Great Wall of China is visible from space with the naked eye',
          start: 0,
          end: 65,
          is_accurate: false,
          confidence: 0.98,
          reason: 'Multiple astronauts and space agencies have confirmed this is a myth. The Great Wall is only 6 meters wide on average and blends with the natural landscape. Even from low Earth orbit, it\'s nearly impossible to see with the naked eye. NASA and astronauts including those from China have debunked this claim.',
          correction: 'The Great Wall of China is not visible from space with the naked eye. It can only be seen in some satellite photographs taken with telephoto lenses',
          sources: [
            {
              url: 'https://www.nasa.gov/vision/space/workinginspace/great_wall.html',
              title: 'NASA - The Great Wall of China',
              snippet: 'The Great Wall of China is not visible from space with the naked eye.'
            },
            {
              url: 'https://www.space.com/great-wall-of-china-visibility-from-space.html',
              title: 'Can You Really See the Great Wall of China from Space?',
              snippet: 'Astronauts confirm the wall is not visible from the International Space Station without aid.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'napoleon-height',
    prompt: 'Napoleon Bonaparte was extremely short for his time',
    category: 'history',
    initialUpvotes: 187,
    cachedResult: {
      original_text: 'Napoleon Bonaparte was extremely short for his time',
      fact_checks: [
        {
          claim: 'Napoleon Bonaparte was extremely short for his time',
          start: 0,
          end: 52,
          is_accurate: false,
          confidence: 0.92,
          reason: 'Historical records show Napoleon was about 5\'6" (168 cm), which was actually average or slightly above average for French men in the early 1800s. The myth arose from confusion between French and British units of measurement, and British propaganda that mocked him as short.',
          correction: 'Napoleon was about 5\'6" (168 cm), which was average or slightly above average height for men of his era',
          sources: [
            {
              url: 'https://www.britannica.com/story/was-napoleon-short',
              title: 'Was Napoleon Short? | Britannica',
              snippet: 'Napoleon was about 5 feet 6 inches tall, average height for the time.'
            },
            {
              url: 'https://www.history.com/news/napoleon-complex-short',
              title: 'The Truth About Napoleon\'s Height - HISTORY',
              snippet: 'Contemporary sources show Napoleon was of normal height for his time period.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'goldfish-memory',
    prompt: 'Goldfish have a 3-second memory span',
    category: 'myths',
    initialUpvotes: 156,
    cachedResult: {
      original_text: 'Goldfish have a 3-second memory span',
      fact_checks: [
        {
          claim: 'Goldfish have a 3-second memory span',
          start: 0,
          end: 38,
          is_accurate: false,
          confidence: 0.96,
          reason: 'Scientific studies have repeatedly shown that goldfish can remember things for at least three months, not three seconds. They can be trained to recognize shapes, colors, and sounds, and can remember feeding schedules. Research shows their memory lasts months and possibly longer.',
          correction: 'Goldfish can remember information for at least three months, and possibly much longer. They can be trained and remember complex tasks',
          sources: [
            {
              url: 'https://www.sciencedaily.com/releases/2009/02/090217141341.htm',
              title: 'Fish Can Recognize Human Faces - Science Daily',
              snippet: 'Research shows fish have much longer memories than previously thought, extending to months.'
            },
            {
              url: 'https://www.discoverwildlife.com/animal-facts/fish/do-goldfish-have-a-3-second-memory/',
              title: 'Do goldfish have a 3-second memory? - Discover Wildlife',
              snippet: 'Goldfish can remember things for at least three months and can be trained to respond to signals.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'vitamin-c-cold',
    prompt: 'Taking large doses of vitamin C can cure the common cold',
    category: 'health',
    initialUpvotes: 143,
    cachedResult: {
      original_text: 'Taking large doses of vitamin C can cure the common cold',
      fact_checks: [
        {
          claim: 'Taking large doses of vitamin C can cure the common cold',
          start: 0,
          end: 56,
          is_accurate: false,
          confidence: 0.94,
          reason: 'Multiple systematic reviews and studies have shown that vitamin C does not cure or prevent colds in the general population. It may slightly reduce the duration of cold symptoms by about 8% in regular users, but it doesn\'t cure the cold. High doses don\'t provide additional benefits.',
          correction: 'Vitamin C may slightly reduce the duration of cold symptoms in regular users, but does not cure or prevent colds',
          sources: [
            {
              url: 'https://www.mayoclinic.org/diseases-conditions/common-cold/expert-answers/vitamin-c/faq-20058030',
              title: 'Vitamin C and Colds - Mayo Clinic',
              snippet: 'Studies show vitamin C does not prevent colds in most people, though it may slightly shorten their duration.'
            },
            {
              url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5409678/',
              title: 'Vitamin C for preventing and treating the common cold - NIH',
              snippet: 'Regular vitamin C supplementation had no effect on common cold incidence in the ordinary population.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'brain-10-percent',
    prompt: 'Humans only use 10% of their brains',
    category: 'science',
    initialUpvotes: 234,
    cachedResult: {
      original_text: 'Humans only use 10% of their brains',
      fact_checks: [
        {
          claim: 'Humans only use 10% of their brains',
          start: 0,
          end: 37,
          is_accurate: false,
          confidence: 0.99,
          reason: 'Neuroscientists have completely debunked this myth using brain imaging technology. MRI and PET scans show that virtually all brain regions are active over the course of a day. Even during sleep, all parts of the brain show some level of activity. Using only 10% would be devastating to human function.',
          correction: 'Humans use virtually all parts of their brain, and most of the brain is active most of the time',
          sources: [
            {
              url: 'https://www.scientificamerican.com/article/do-people-only-use-10-percent-of-their-brains/',
              title: 'Do People Only Use 10 Percent of Their Brains? - Scientific American',
              snippet: 'Brain imaging studies clearly show that humans use far more than 10% of their brains.'
            },
            {
              url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3897366/',
              title: 'Neuromyths in Education - NIH',
              snippet: 'The 10% myth is completely false. We use all of our brain, and most of it is active most of the time.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'lightning-twice',
    prompt: 'Lightning never strikes the same place twice',
    category: 'myths',
    initialUpvotes: 89,
    cachedResult: {
      original_text: 'Lightning never strikes the same place twice',
      fact_checks: [
        {
          claim: 'Lightning never strikes the same place twice',
          start: 0,
          end: 45,
          is_accurate: false,
          confidence: 0.97,
          reason: 'Lightning frequently strikes the same place multiple times, especially tall structures. The Empire State Building is struck by lightning about 25 times per year. Lightning rods work precisely because lightning tends to hit the same elevated points repeatedly. This is a common and dangerous myth.',
          correction: 'Lightning often strikes the same place multiple times. Tall structures like the Empire State Building are hit dozens of times per year',
          sources: [
            {
              url: 'https://www.weather.gov/safety/lightning-myths',
              title: 'Lightning Safety Myths - NOAA',
              snippet: 'Lightning definitely strikes the same place more than once. Tall, isolated objects are especially prone to repeated strikes.'
            },
            {
              url: 'https://www.nationalgeographic.com/science/article/lightning-myths',
              title: 'Lightning Myths and Facts - National Geographic',
              snippet: 'The Empire State Building is struck by lightning around 25 times per year.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'cracking-knuckles',
    prompt: 'Cracking your knuckles causes arthritis',
    category: 'health',
    initialUpvotes: 112,
    cachedResult: {
      original_text: 'Cracking your knuckles causes arthritis',
      fact_checks: [
        {
          claim: 'Cracking your knuckles causes arthritis',
          start: 0,
          end: 40,
          is_accurate: false,
          confidence: 0.93,
          reason: 'Multiple studies, including one by Dr. Donald Unger who cracked only his left knuckles for 60 years, found no link between knuckle cracking and arthritis. The sound comes from gas bubbles in joint fluid, not bone damage. Medical research consistently shows no connection to arthritis.',
          correction: 'Cracking knuckles does not cause arthritis, according to multiple scientific studies',
          sources: [
            {
              url: 'https://www.health.harvard.edu/pain/does-knuckle-cracking-cause-arthritis',
              title: 'Does knuckle cracking cause arthritis? - Harvard Health',
              snippet: 'The short answer is no. Multiple studies have found no link between knuckle cracking and arthritis.'
            },
            {
              url: 'https://www.arthritis.org/health-wellness/healthy-living/managing-pain/joint-protection/cracking-your-knuckles',
              title: 'Cracking Your Knuckles - Arthritis Foundation',
              snippet: 'Knuckle cracking has not been shown to cause or worsen arthritis.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'mount-everest',
    prompt: 'Mount Everest is the tallest mountain on Earth',
    category: 'science',
    initialUpvotes: 76,
    cachedResult: {
      original_text: 'Mount Everest is the tallest mountain on Earth',
      fact_checks: [
        {
          claim: 'Mount Everest is the tallest mountain on Earth',
          start: 0,
          end: 47,
          is_accurate: true,
          confidence: 0.99,
          reason: 'Multiple sources consistently confirm that Mount Everest is indeed the tallest mountain on Earth, with its peak reaching 8,848.86 meters (29,031.7 feet) above sea level, as measured in 2020. While Mauna Kea in Hawaii is taller when measured from its base on the ocean floor, Everest has the highest elevation above sea level.',
          correction: null,
          sources: [
            {
              url: 'https://www.nationalgeographic.com/adventure/article/mount-everest',
              title: 'Mount Everest - National Geographic',
              snippet: 'Mount Everest, at 8,848.86 meters, is the highest mountain above sea level on Earth.'
            },
            {
              url: 'https://www.britannica.com/place/Mount-Everest',
              title: 'Mount Everest | Height, Location, Map, & Facts | Britannica',
              snippet: 'Mount Everest is Earth\'s highest mountain above sea level, located in the Mahalangur Himal sub-range.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'bats-blind',
    prompt: 'Bats are blind',
    category: 'myths',
    initialUpvotes: 95,
    cachedResult: {
      original_text: 'Bats are blind',
      fact_checks: [
        {
          claim: 'Bats are blind',
          start: 0,
          end: 14,
          is_accurate: false,
          confidence: 0.96,
          reason: 'All bat species can see, and many have excellent vision. While bats primarily use echolocation to navigate in the dark, they have functional eyes and many species have good eyesight, especially fruit bats which rely heavily on vision. The phrase "blind as a bat" is completely inaccurate.',
          correction: 'Bats are not blind. All bats can see, and many species have excellent vision in addition to using echolocation',
          sources: [
            {
              url: 'https://www.nwf.org/Educational-Resources/Wildlife-Guide/Mammals/Bats',
              title: 'Bats - National Wildlife Federation',
              snippet: 'Contrary to popular belief, bats are not blind. All bats can see, and many species have good eyesight.'
            },
            {
              url: 'https://www.batcon.org/article/bats-are-not-blind/',
              title: 'Bats Are Not Blind - Bat Conservation International',
              snippet: 'All bats have functional eyes and can see. Some species have excellent vision, particularly fruit bats.'
            }
          ]
        }
      ]
    }
  }
];


/**
 * Get example check by ID
 */
export function getExampleCheck(id: string): ExampleCheck | undefined {
  return EXAMPLE_CHECKS.find(check => check.id === id);
}

/**
 * Get example checks by category
 */
export function getExampleChecksByCategory(category: ExampleCategory): ExampleCheck[] {
  return EXAMPLE_CHECKS.filter(check => check.category === category);
}

/**
 * Category metadata for UI display
 */
export const CATEGORY_INFO: Record<ExampleCategory, { label: string; emoji: string; description: string }> = {
  science: {
    label: 'Science',
    emoji: '🔬',
    description: 'Scientific claims and phenomena'
  },
  health: {
    label: 'Health',
    emoji: '💊',
    description: 'Medical and health-related claims'
  },
  history: {
    label: 'History',
    emoji: '📜',
    description: 'Historical facts and events'
  },
  myths: {
    label: 'Common Myths',
    emoji: '🎭',
    description: 'Popular misconceptions'
  },
  politics: {
    label: 'Politics',
    emoji: '🏛️',
    description: 'Political claims and statements'
  }
};
