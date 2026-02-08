# ContraceptIQ User Guide: Discontinuation Risk Assessment

**Version:** 1.0  
**Last Updated:** January 29, 2026  
**App Platform:** iOS & Android (React Native)

---

## 📱 Table of Contents

1. [Welcome to ContraceptIQ](#welcome-to-contraceptiq)
2. [Getting Started](#getting-started)
3. [Understanding Risk Assessment](#understanding-risk-assessment)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [Understanding Your Results](#understanding-your-results)
6. [Features Explained](#features-explained)
7. [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Privacy & Data](#privacy--data)
11. [Contact & Support](#contact--support)

---

## Welcome to ContraceptIQ

ContraceptIQ is your personal guide to making informed decisions about contraceptive methods. Our **Discontinuation Risk Assessment** feature uses advanced machine learning to predict whether you might discontinue your current contraceptive method, helping you and your healthcare provider choose the best option for your needs.

### What This App Does

✅ **Assesses Your Risk** - Predicts likelihood of discontinuing your current method  
✅ **Provides Personalized Insights** - Based on 26 key factors about you  
✅ **Guides Your Choices** - Age-appropriate contraceptive recommendations  
✅ **Supports Healthcare Conversations** - Share results with your provider  
✅ **Respects Your Privacy** - Your data stays on your device

### What This App Does NOT Do

❌ Replace medical advice from healthcare providers  
❌ Prescribe contraceptive methods  
❌ Diagnose medical conditions  
❌ Store your personal data on external servers

> **Important:** ContraceptIQ is a decision-support tool. Always consult with a qualified healthcare provider before making decisions about contraception.

---

## Getting Started

### System Requirements

- **iOS:** Version 12.0 or later
- **Android:** Version 8.0 (Oreo) or later
- **Internet Connection:** Required for risk assessment
- **Storage:** ~50 MB free space

### First Launch

1. **Open the App** - Tap the ContraceptIQ icon
2. **Read the Onboarding** - Swipe through 3 introductory screens:
   - Take Charge of Your Health
   - Make Confident, Informed Decisions
   - Empower Yourself with Knowledge
3. **Accept Disclaimer** - Tap "Get Started" and read the disclaimer
4. **Tap Continue** - You're ready to use the app!

### Navigation

The app uses a **drawer menu** (☰ icon in top-left):

- **Home** - Main dashboard
- **What's Right for Me?** - Onboarding and recommendations
- **Recommendation** - Risk assessment and results
- **Contraceptive Methods** - Method information
- **Did You Know?** - Educational content
- **FAQs** - Common questions
- **About Us** - App information

---

## Understanding Risk Assessment

### What is Discontinuation Risk?

**Discontinuation** means stopping use of a contraceptive method before reaching your reproductive goals. High discontinuation risk might indicate:

- The method doesn't fit your lifestyle
- Side effects are concerning
- Access or cost issues
- Method doesn't meet your needs

### How It Works

Our assessment uses a **hybrid machine learning model** with:

- **87.8% Recall** - Catches most high-risk cases
- **82.2% Accuracy** - Overall prediction accuracy
- **26 Input Factors** - Comprehensive assessment

The model considers:

- **Demographics** - Age, region, education, religion, ethnicity
- **Relationship Status** - Marital status, partner living arrangements
- **Household** - Head of household gender
- **Employment** - Your occupation
- **Partner Information** - Education, age, desires for children
- **Health Behaviors** - Smoking status
- **Fertility History** - Number of children, desires for more
- **Pregnancy History** - Wanted/unwanted last pregnancy
- **Current Method** - Which contraceptive you use
- **Method History** - Duration of use, usage pattern
- **Information Received** - Side effect counseling
- **Access** - Where you obtained method
- **Past Experience** - Previous discontinuations and reasons

### Risk Levels Explained

#### 🟢 LOW RISK

**Meaning:** Your current method appears well-suited to your needs.

**What This Means:**

- You're likely to continue using your current method
- Method aligns with your lifestyle and preferences
- Continue regular healthcare follow-ups

**Confidence Score:** Typically 60-95%

#### 🔴 HIGH RISK

**Meaning:** You may be at higher risk of discontinuing your current method.

**What This Means:**

- Consider discussing alternatives with your provider
- Explore methods that better match your needs
- Review potential side effects and management
- Discuss barriers to continued use

**Confidence Score:** Typically 60-95%

---

## Step-by-Step Guide

### Step 1: Access the Assessment

1. Open ContraceptIQ
2. Tap **☰** menu icon (top-left)
3. Select **"Recommendation"**

**Screenshot Reference:** _Main screen with drawer menu open_

---

### Step 2: Enter Your Age

1. Use the **age slider** to select your age range:
   - Menarche to < 18 years
   - 18 - 19 years
   - 20 - 39 years
   - 40 - 45 years
   - ≥ 46 years

2. A **modal will appear** showing age-appropriate contraceptive recommendations

**Why Age Matters:** Different methods are recommended for different life stages based on health considerations and fertility goals.

**Screenshot Reference:** _Age selection slider with color-coded method recommendations_

---

### Step 3: Add Your Preferences (Optional)

Tap **"+ Add Preferences"** to:

- Specify method preferences
- Note health considerations
- Indicate lifestyle factors

**Note:** This feature personalizes recommendations but is not required for risk assessment.

---

### Step 4: Perform Risk Assessment

1. Tap the **"🔍 Assess My Discontinuation Risk"** button
2. Wait for assessment (typically 2-5 seconds)
3. View your results in the **Risk Assessment Card**

**What Happens:**

- App sends your information to secure backend
- Machine learning model analyzes 26 factors
- Results display immediately

**Screenshot Reference:** _Assessment button and loading state_

---

### Step 5: View Your Results

The **Risk Assessment Card** displays:

#### Top Section

- **Risk Level** - LOW or HIGH (color-coded)
- **Confidence Score** - How confident the model is (0-100%)

#### Middle Section

- **Your Current Method** - The contraceptive being assessed
- **Recommendation** - Personalized guidance based on risk level

#### Bottom Section

- **Timestamp** - When assessment was performed
- **Action Buttons** - Share with provider, save results

**Screenshot Reference:** _Complete Risk Assessment Card with all sections_

---

## Understanding Your Results

### Reading the Risk Assessment Card

#### 1. Risk Level Badge

```
┌──────────────┐
│  HIGH RISK   │  ← Red background = High Risk
└──────────────┘

┌──────────────┐
│   LOW RISK   │  ← Green background = Low Risk
└──────────────┘
```

#### 2. Confidence Score

```
Confidence: 87%
├─────────────────────┤
│ ████████████████░░░ │
└─────────────────────┘
```

**What It Means:**

- **60-75%** - Moderate confidence
- **75-85%** - Good confidence
- **85-95%** - High confidence
- **>95%** - Very high confidence

#### 3. Recommendations

**For LOW RISK:**

> "Your current contraceptive method appears well-suited to your needs. Continue regular follow-ups with your healthcare provider."

**Actions to Take:**

- Continue current method
- Maintain regular check-ups
- Monitor for any changes in needs or side effects

**For HIGH RISK:**

> "Consider discussing method alternatives with a healthcare provider. Explore options that better match your needs and preferences."

**Actions to Take:**

- Schedule appointment with provider
- Discuss concerns about current method
- Explore alternative methods
- Review side effects and how to manage them
- Consider barriers (cost, access, lifestyle)

---

## Features Explained

### 1. Age-Based Recommendations

**How It Works:**
Move the age slider to see contraceptive methods color-coded by WHO Medical Eligibility Criteria (MEC):

- **🟢 Green (Category 1)** - No restriction, method can be used
- **🟡 Yellow (Category 2)** - Method can generally be used, advantages outweigh risks
- **🟠 Orange (Category 3)** - Risks usually outweigh advantages, other methods preferred
- **🔴 Red (Category 4)** - Method should not be used

**Methods Shown:**

- Copper IUD (Cu-IUD)
- Implant (LNG/ETG)
- Injectables (DMPA)
- Pills (Combined/POPs)
- Patch (Hormonal)
- Levonorgestrel IUD (LNG-IUD)

---

### 2. Error Handling & Retry

The app intelligently handles errors:

#### Offline Mode

**What You'll See:**

```
📡 No Internet Connection

Your device is offline. Please check your
internet connection and try again.

💡 Please check your WiFi or mobile data connection

[Retry]  [Dismiss]
```

**What to Do:**

1. Check WiFi or mobile data
2. Tap **"Retry"** when connected

#### Validation Errors

**What You'll See:**

```
⚠️ Invalid Input

Please check your answers and ensure all
fields are filled correctly.

💡 Some information is missing or invalid

[Review]  [Dismiss]
```

**What to Do:**

1. Review your input
2. Ensure age is selected
3. Try assessment again

#### Server Errors

**What You'll See:**

```
❌ Service Unavailable

The assessment service is temporarily
unavailable. Please try again later.

💡 The service might be under maintenance

[Retry]  [Dismiss]
```

**What to Do:**

1. Wait a few moments
2. Tap **"Retry"**
3. If persists, try again later

---

### 3. Automatic Retry Logic

The app automatically retries failed requests:

- **Network errors** - 3 attempts with increasing delays (1s, 2s, 4s)
- **Server unavailable** - 3 attempts with longer delays (2s, 4s, 8s)
- **Timeout** - 30-second limit, then retry option

**You Don't Need to Do Anything** - Just wait for the app to retry automatically!

---

## Frequently Asked Questions (FAQ)

### General Questions

**Q: Is ContraceptIQ free to use?**  
A: Yes, the app is completely free.

**Q: Do I need to create an account?**  
A: No, the app works without registration or login.

**Q: Is my data stored online?**  
A: No, all your assessment data stays on your device.

**Q: Can I use the app without internet?**  
A: You need internet only for risk assessments. All other features work offline.

---

### Assessment Questions

**Q: How accurate is the risk assessment?**  
A: The model has 87.8% recall (catches most high-risk cases) and 82.2% overall accuracy based on real-world data.

**Q: How long does an assessment take?**  
A: Typically 2-5 seconds with good internet connection.

**Q: Can I perform multiple assessments?**  
A: Yes, you can assess as many times as needed. Latest result is shown.

**Q: What if I'm between age ranges?**  
A: Select the range you fall into. For example, if you're 18, select "18-19 years."

**Q: Why does the app need 26 pieces of information?**  
A: More factors = more accurate prediction. The model considers comprehensive factors affecting contraceptive use.

---

### Results Questions

**Q: My result shows HIGH RISK. What should I do?**  
A: Schedule an appointment with your healthcare provider to discuss alternative methods that better suit your needs.

**Q: My result shows LOW RISK. Does that mean I should continue my method?**  
A: It suggests your current method aligns with your needs, but continue regular check-ups and monitor for changes.

**Q: The confidence score is only 65%. Should I trust it?**  
A: 65% is moderate confidence. Consider it one factor in your decision-making, and discuss with your provider.

**Q: Can results change over time?**  
A: Yes! Your circumstances, preferences, and needs may evolve. Reassess periodically or when life changes occur.

**Q: Should I share my results with my doctor?**  
A: Yes! Results can facilitate meaningful conversations about contraceptive choices.

---

### Technical Questions

**Q: Why does the button say "Loading..." when I tap it?**  
A: The app is processing your assessment. This typically takes 2-5 seconds.

**Q: I tapped the button multiple times. Will I get charged multiple times?**  
A: No charges apply (the app is free), and the system prevents duplicate requests automatically.

**Q: What happens if I navigate away during assessment?**  
A: The app automatically cancels pending requests to prevent issues. Simply return and try again.

**Q: Why do I see a "Retry" button?**  
A: An error occurred (network, server, etc.). Tap "Retry" to attempt the assessment again.

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: "No Internet Connection" Error

**Symptoms:**

- Assessment fails immediately
- Offline icon (📡) appears

**Solutions:**

1. ✅ Check WiFi connection
2. ✅ Check mobile data is enabled
3. ✅ Try toggling Airplane mode on/off
4. ✅ Move to area with better signal
5. ✅ Restart the app

---

#### Issue 2: Assessment Takes Too Long

**Symptoms:**

- Loading indicator spins for >30 seconds
- "Timeout" error appears

**Solutions:**

1. ✅ Check internet speed (assessment needs stable connection)
2. ✅ Close other apps using internet
3. ✅ Switch from mobile data to WiFi (or vice versa)
4. ✅ Wait for better network conditions
5. ✅ Tap "Retry" when prompted

---

#### Issue 3: "Invalid Input" Error

**Symptoms:**

- Assessment fails with validation warning
- Orange warning icon (⚠️)

**Solutions:**

1. ✅ Ensure you selected an age range
2. ✅ Verify all required information is provided
3. ✅ Check that age is realistic (15-55 years)
4. ✅ Restart assessment process
5. ✅ Try closing and reopening the app

---

#### Issue 4: "Service Unavailable" Error

**Symptoms:**

- Red error icon (❌)
- Message about temporary unavailability

**Solutions:**

1. ✅ Wait 2-5 minutes and try again
2. ✅ Tap "Retry" button
3. ✅ The app will automatically retry 3 times
4. ✅ If persists, service may be under maintenance
5. ✅ Try again in 30 minutes

---

#### Issue 5: App Crashes or Freezes

**Symptoms:**

- App closes unexpectedly
- Screen becomes unresponsive

**Solutions:**

1. ✅ Force close the app completely
2. ✅ Reopen the app
3. ✅ Clear app cache (Settings → Apps → ContraceptIQ → Clear Cache)
4. ✅ Restart your device
5. ✅ Reinstall the app if problem persists

---

#### Issue 6: Results Don't Display

**Symptoms:**

- Assessment completes but no card appears
- Blank screen after loading

**Solutions:**

1. ✅ Scroll down (results may be below fold)
2. ✅ Navigate away and return to Recommendation screen
3. ✅ Perform assessment again
4. ✅ Restart the app
5. ✅ Check for app updates

---

#### Issue 7: Can't Navigate to Recommendation Screen

**Symptoms:**

- Tapping "Continue" does nothing
- Screen doesn't change

**Solutions:**

1. ✅ Ensure you accepted the disclaimer
2. ✅ Wait a moment and try again
3. ✅ Use menu (☰) to navigate manually
4. ✅ Restart the app
5. ✅ Check for app updates

---

## Best Practices

### For Accurate Assessments

✅ **Be Honest** - Provide truthful information  
✅ **Be Current** - Use your present circumstances  
✅ **Be Complete** - Provide all requested information  
✅ **Be Consistent** - Don't change answers between assessments unless circumstances changed  
✅ **Be Informed** - Understand what each question asks

### For Best Results

✅ **Reassess Periodically** - Every 6-12 months or when life changes  
✅ **Discuss with Provider** - Share results at appointments  
✅ **Consider Context** - Results are one factor among many  
✅ **Stay Updated** - Keep the app updated for latest improvements  
✅ **Use Good Connection** - WiFi preferred for assessments

### For Privacy

✅ **Don't Share Device** - Keep your device secure  
✅ **Lock Your Phone** - Use password/biometric lock  
✅ **Close App After Use** - Swipe away when done  
✅ **Don't Screenshot Sensitive Info** - Avoid cloud backups of results  
✅ **Delete App When Done** - If you no longer need it

### When to Reassess

📅 **Every 6-12 months** - Regular check-in  
📅 **After major life changes** - New relationship, career change, relocation  
📅 **If experiencing side effects** - Method isn't working well  
📅 **When considering switching methods** - Evaluate current before changing  
📅 **If desires for children change** - Family planning evolves  
📅 **After childbirth** - Postpartum needs differ

---

## Privacy & Data

### What We Collect

**Assessment Data:**

- Age range
- Demographic information (if provided)
- Current contraceptive method
- Assessment preferences

**Usage Data:**

- App screens visited
- Assessment frequency
- Error occurrences (for app improvement)

### What We DON'T Collect

❌ Personal identifying information (name, email, phone)  
❌ Location data beyond general region  
❌ Contact information  
❌ Healthcare provider details  
❌ Medical records  
❌ Payment information

### How We Protect Your Data

🔒 **Local Storage** - Data stays on your device  
🔒 **Encrypted Transmission** - Assessment requests use HTTPS  
🔒 **No Cloud Storage** - Results not stored on servers  
🔒 **Temporary Processing** - Backend processes and discards immediately  
🔒 **No Third-Party Sharing** - Data never sold or shared

### Your Rights

✅ **Delete Anytime** - Uninstall app to remove all data  
✅ **Control Data** - You choose what to provide  
✅ **No Tracking** - No advertising or analytics tracking  
✅ **Transparent** - We explain what we use and why

---

## Contact & Support

### App Information

**Version:** 1.0  
**Developer:** ContraceptIQ Team  
**Platform:** iOS & Android  
**Last Updated:** January 29, 2026

### Get Help

📧 **Email Support:** support@contraceptiq.app  
🌐 **Website:** www.contraceptiq.app  
📱 **In-App:** Menu → About Us → Contact

### Report Issues

Found a bug? Have feedback? Contact us:

- Describe the issue
- Include steps to reproduce
- Mention your device and OS version
- Attach screenshots if helpful

### Healthcare Questions

For medical advice about contraception:

- Contact your healthcare provider
- Visit a family planning clinic
- Call a contraceptive hotline in your region

**Remember:** We provide decision support, not medical advice.

---

## Additional Resources

### Learn More About Contraception

- **WHO Family Planning:** www.who.int/health-topics/family-planning
- **CDC Contraception Guide:** www.cdc.gov/reproductivehealth/contraception
- **Planned Parenthood:** www.plannedparenthood.org/learn/birth-control

### Emergency Contraception

If you need emergency contraception:

- Contact your healthcare provider immediately
- Visit a pharmacy (many locations offer over-the-counter)
- Call emergency hotline in your region

**Time is critical** - Emergency contraception is most effective when taken soon after unprotected intercourse.

---

## Glossary

**Assessment** - Evaluation of discontinuation risk  
**Confidence Score** - How certain the model is about prediction (0-100%)  
**Contraceptive Method** - Birth control method (pills, IUD, implant, etc.)  
**Discontinuation** - Stopping use of contraceptive method  
**HIGH RISK** - Increased likelihood of discontinuing method  
**LOW RISK** - Lower likelihood of discontinuing method  
**MEC** - WHO Medical Eligibility Criteria for contraceptive use  
**ML Model** - Machine Learning model that makes predictions  
**Recall** - Percentage of high-risk cases correctly identified  
**Risk Level** - Overall assessment result (LOW or HIGH)

---

## Version History

**Version 1.0** (January 2026)

- Initial release
- Discontinuation risk assessment
- Age-based recommendations
- Error handling and retry logic
- Offline detection
- Risk assessment card

---

**Thank you for using ContraceptIQ!**

We're committed to empowering you with information to make confident, informed decisions about your reproductive health. Your feedback helps us improve.

_Take charge of your health. Make informed decisions. Empower yourself with knowledge._

---

**Disclaimer:** This app is for informational and educational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider regarding your contraceptive choices and reproductive health.
