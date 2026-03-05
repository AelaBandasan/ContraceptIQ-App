export interface ContraceptiveDetail {
    id: string;
    name: string;
    type?: string;
    description: string;
    frequency: string;
    frequencyIcon?: 'time-outline' | 'calendar-outline' | 'medical-outline';
    effectiveness: string;
    perfectEffectiveness?: string;
    typicalEffectiveness?: string;
    priceRange: string;
    howToUse: string[] | string;
    benefits: string[];
    disadvantages: string[];
    reversible?: boolean;
    pregnancyPlanning?: string;
    illustration: any;
}

export const CONTRACEPTIVE_DETAILS: Record<string, ContraceptiveDetail> = {
    chc: {
        id: 'chc',
        name: 'Combined Hormonal Contraceptives (CHC)',
        type: 'Hormonal',
        description: 'Combined hormonal contraceptives are birth control methods that contain two hormones—estrogen and progestin—similar to the natural hormones in a woman’s body. They work mainly by preventing the ovaries from releasing an egg (ovulation).',
        frequency: 'Daily',
        frequencyIcon: 'time-outline',
        effectiveness: '>99% effective (perfect use)',
        perfectEffectiveness: '>99%',
        typicalEffectiveness: '7 in 100',
        priceRange: '₱50 - ₱950 / month',
        howToUse: 'Take one pill at the same time every day. If using the patch, apply weekly. If using the vaginal ring, insert monthly according to instructions.',
        benefits: [
            'User-controlled',
            'Do not interfere with sex',
            'easy to use and obtain',
            'Regulates periods',
            'Help protect against ovarian and endometrial cancer',
            'Reduces cramps',
            'May improve acne'
        ],
        disadvantages: [
            'Bleeding changes',
            'Headaches',
            'Nausea',
            'Breast tenderness',
            'Must remember regularly',
            'Rare blood clot risk',
            'No STI protection'
        ],
        reversible: true,
        pregnancyPlanning: 'Fertility returns quickly after stopping.',
        illustration: require('../../assets/image/sq_chcpills.png'),
    },
    
    pop: {
        id: 'pop',
        name: 'Progestin-Only Pill',
        description: 'Progestin-only pills are oral contraceptives that contain only a progestin hormone  without estrogen. They primarily work by thickening cervical mucus and may also suppress ovulation',
        frequency: 'Daily',
        effectiveness: '99%',
        priceRange: '₱150 - ₱1,500 / month',
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
        type: 'Estrogen-free',
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
