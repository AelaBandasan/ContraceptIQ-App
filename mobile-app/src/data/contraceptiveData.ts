export interface ContraceptiveDetail {
    id: string;
    name: string;
    description: string;
    frequency: string;
    effectiveness: string;
    priceRange: string;
    howToUse: string[];
    benefits: string[];
    disadvantages: string[];
    illustration: any;
}

export const CONTRACEPTIVE_DETAILS: Record<string, ContraceptiveDetail> = {
    chc: {
        id: 'chc',
        name: 'The Pill (Combined)',
        description: 'Daily hormonal tablet containing estrogen and progestin.',
        frequency: 'Daily',
        effectiveness: '99%',
        priceRange: '$15 - $50 / month',
        howToUse: [
            'Take one pill at the same time every day.',
            'Follow the arrows on the pack to stay on track.',
            'If you miss a pill, refer to the pack instructions immediately.'
        ],
        benefits: ['Clearer Skin', 'Regular Periods', 'Relieves Cramps'],
        disadvantages: ['Mood Swings', 'Tender Breasts', 'Headaches'],
        illustration: require('../../assets/image/patchh.png'),
    },
    pop: {
        id: 'pop',
        name: 'Progestin-Only Pill',
        description: 'Estrogen-free daily hormonal tablet, also known as the mini-pill.',
        frequency: 'Daily',
        effectiveness: '99%',
        priceRange: '$15 - $50 / month',
        howToUse: [
            'Take one pill at the same time every day.',
            'Must be taken within the same 3-hour window daily.',
            'Useful if you cannot take estrogen or are breastfeeding.'
        ],
        benefits: ['Estrogen-free', 'Safe for Breastfeeding', 'Fewer Side Effects'],
        disadvantages: ['Spotting', 'Strict Timing Required', 'Irregular Bleeding'],
        illustration: require('../../assets/image/pillss.png'),
    },
    implant: {
        id: 'implant',
        name: 'Implant (Nexplanon)',
        description: 'A small, flexible rod placed under the skin of your upper arm.',
        frequency: 'Every 3 Years',
        effectiveness: '>99%',
        priceRange: '$0 - $1,300 (one-time)',
        howToUse: [
            'A healthcare professional inserts it under the skin.',
            'Lasts for up to 3 years without daily action.',
            'Can be removed at any time if you wish to conceive.'
        ],
        benefits: ['Low Maintenance', 'Extremely Effective', 'Lasts 3 Years'],
        disadvantages: ['Irregular Periods', 'Procedure Required', 'Bruising initially'],
        illustration: require('../../assets/image/implantt.png'),
    },
    'cu-iud': {
        id: 'cu-iud',
        name: 'Copper IUD (Cu-IUD)',
        description: 'Non-hormonal T-shaped device placed in the uterus.',
        frequency: 'Every 10 Years',
        effectiveness: '>99%',
        priceRange: '$0 - $1,300 (one-time)',
        howToUse: [
            'A clinician inserts the device into the uterus.',
            'Provides protection for up to 10 years.',
            'Works by preventing sperm from reaching the egg.'
        ],
        benefits: ['Non-hormonal', 'Most Cost-effective', 'Emergency Choice'],
        disadvantages: ['Heavier Periods', 'Increased Cramping', 'Procedure Required'],
        illustration: require('../../assets/image/copperiud.png'),
    },
    'lng-ius': {
        id: 'lng-ius',
        name: 'Hormonal IUD (LNG-IUS)',
        description: 'Small T-shaped device that releases progestin into the uterus.',
        frequency: 'Every 3-8 Years',
        effectiveness: '>99%',
        priceRange: '$0 - $1,300 (one-time)',
        howToUse: [
            'A clinician inserts the device into the uterus.',
            'Releases hormones locally to thin the uterine lining.',
            'Lasts 3 to 8 years depending on the brand.'
        ],
        benefits: ['Lighter Periods', 'Reduced Cramps', 'High Satisfaction'],
        disadvantages: ['Spotting initially', 'Procedure Required', 'Hormonal changes'],
        illustration: require('../../assets/image/leviud.png'),
    },
    dmpa: {
        id: 'dmpa',
        name: 'Injectable (The Shot)',
        description: 'A hormone injection given in the arm or buttocks.',
        frequency: 'Every 3 Months',
        effectiveness: '94%',
        priceRange: '$20 - $150 / shot',
        howToUse: [
            'Get an injection every 12 to 13 weeks.',
            'Requires a visit to a healthcare provider or pharmacist.',
            'If you are late for a shot, use backup protection.'
        ],
        benefits: ['Private & Discreet', 'No Daily Pill', 'Highly Effective'],
        disadvantages: ['Delayed Fertility', 'Bone Density Risk', 'Weight Gain'],
        illustration: require('../../assets/image/injectables.png'),
    }
};
