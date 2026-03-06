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
        name: 'Progestin-Only Pill (POP)',
        type: 'Estrogen-free',
        description: 'Progestin-only pills are oral contraceptives that contain only a progestin hormone without estrogen. They primarily work by thickening cervical mucus and may also suppress ovulation.',
        frequency: 'Daily',
        frequencyIcon: 'time-outline',
        effectiveness: '>99% effective (perfect use)',
        perfectEffectiveness: '>99%',
        typicalEffectiveness: '7 in 100',
        priceRange: '₱150 - ₱500 / month',
        howToUse: [
            'Take one pill every day at the same time.',
            'No hormone-free break between packs.',
            'Must be taken within the same 3-hour window daily.',
            'Useful if you cannot take estrogen or are breastfeeding.'
        ],
        benefits: [
            'Safe for breastfeeding',
            'Suitable for those who cannot take estrogen',
            'Quickly reversible after discontinuation'
        ],
        disadvantages: [
            'Must be taken consistently on time',
            'Irregular bleeding common',
            'No STI protection'
        ],
        reversible: true,
        pregnancyPlanning: 'Fertility returns quickly after stopping.',
        illustration: require('../../assets/image/pillss.png'),
    },
    implant: {
        id: 'implant',
        name: 'Implant (LNG/ETG)',
        type: 'Estrogen-free',
        description: 'The contraceptive implant is a small, flexible rod placed under the skin of the upper arm that slowly releases progestin to prevent pregnancy.',
        frequency: '3-5 Years',
        frequencyIcon: 'time-outline',
        effectiveness: '>99% effective',
        perfectEffectiveness: '>99%',
        typicalEffectiveness: '<1 in 1000',
        priceRange: '₱3,000 - ₱8,000',
        howToUse: [
            'Inserted by a trained healthcare provider.',
            'Placed under the skin of the upper arm.',
            'Requires no daily action.',
            'Lasts for 3-5 years.'
        ],
        benefits: [
            'Very effective',
            'Long-term protection',
            'Low maintenance',
            'Rapid return to fertility'
        ],
        disadvantages: [
            'Irregular bleeding',
            'Requires minor procedure',
            'No STI protection'
        ],
        reversible: true,
        pregnancyPlanning: 'Fertility returns quickly after removal.',
        illustration: require('../../assets/image/implantt.png'),
    },
    'cu-iud': {
        id: 'cu-iud',
        name: 'Copper IUD (Cu-IUD)',
        type: 'Hormone-free',
        description: 'The copper-bearing IUD is a small device placed in the uterus that releases copper, which interferes with sperm and prevents fertilization.',
        frequency: '10-12 Years',
        frequencyIcon: 'time-outline',
        effectiveness: '>99% effective',
        perfectEffectiveness: '>99%',
        typicalEffectiveness: '<1 in 100',
        priceRange: '₱2,000 - ₱6,000',
        howToUse: [
            'Inserted by a trained healthcare provider.',
            'Placed inside the uterus.',
            'Users should check strings periodically.',
            'Provides protection for up to 10-12 years.'
        ],
        benefits: [
            'Hormone-free',
            'Long-term protection',
            'Can be used as emergency contraception',
            'Immediate return to fertility'
        ],
        disadvantages: [
            'May cause heavier bleeding and cramps',
            'More cramps',
            'No STI protection'
        ],
        reversible: true,
        pregnancyPlanning: 'Fertility returns quickly after removal.',
        illustration: require('../../assets/image/copperiud.png'),
    },
    'lng-ius': {
        id: 'lng-ius',
        name: 'Hormonal IUD (LNG-IUD)',
        type: 'Hormonal',
        description: 'The hormonal IUD is a small T-shaped device placed in the uterus that releases levonorgestrel, a type of progestin, to prevent pregnancy.',
        frequency: '3-8 Years',
        frequencyIcon: 'time-outline',
        effectiveness: '>99% effective',
        perfectEffectiveness: '>99%',
        typicalEffectiveness: '<1 in 100',
        priceRange: '₱8,000 - ₱15,000',
        howToUse: [
            'Inserted by a trained healthcare provider.',
            'Placed inside the uterus.',
            'Requires minimal ongoing action.',
            'Lasts for 3-8 years.'
        ],
        benefits: [
            'Very effective',
            'Lighter periods',
            'Reduced cramps',
            'Provide long-term contraception'
        ],
        disadvantages: [
            'Irregular spotting may occur initially',
            'Higher upfront cost',
            'No STI protection'
        ],
        reversible: true,
        pregnancyPlanning: 'Fertility returns quickly after removal.',
        illustration: require('../../assets/image/leviud.png'),
    },
    dmpa: {
        id: 'dmpa',
        name: 'Injectable Contraceptives (DMPA)',
        type: 'Hormonal',
        description: 'Injectable contraceptives are progestin shots given by a healthcare provider that prevent ovulation and thicken cervical mucus to prevent pregnancy.',
        frequency: 'Every 3 months',
        frequencyIcon: 'time-outline',
        effectiveness: '>99% effective (perfect use)',
        perfectEffectiveness: '>99%',
        typicalEffectiveness: '6 in 100',
        priceRange: '₱150 - ₱500 / injection',
        howToUse: [
            'Injection received on schedule from a trained provider.',
            'Typically given every three months.',
            'Requires a visit to a healthcare provider.',
            'If you are late for a shot, use backup protection.'
        ],
        benefits: [
            'Private',
            'No daily action',
            'Safe during breastfeeding'
        ],
        disadvantages: [
            'Delayed return to fertility',
            'Irregular bleeding',
            'Possible weight gain',
            'No STI protection'
        ],
        reversible: true,
        pregnancyPlanning: 'Fertility may take several months to return.',
        illustration: require('../../assets/image/injectables.png'),
    }
};
