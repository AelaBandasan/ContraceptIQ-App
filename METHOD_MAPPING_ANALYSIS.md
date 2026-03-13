# ContraceptIQ: Contraceptive Method Mapping Architecture

## 1. Architectural Overview
ContraceptIQ utilizes a hybrid architecture that separates **behavioral discontinuation risk** (XGBoost ML model trained on NDHS data) from **clinical safety eligibility** (Rule-based Decision Tree using WHO MEC guidelines). 

Because the NDHS training dataset has broad, generic categories, we must map user inputs carefully across three layers to prevent clinical misclassification.

**The Three Layers:**
1. **Form Input:** What the user selects.
2. **MEC Layer (`mecService.ts`):** Evaluates strict clinical contraindications (Outputs MEC 1-4).
3. **ML Layer (`featureEncoder.ts`):** Evaluates behavioral discontinuation risk (Outputs % score).

---

## 2. Issue 1: The "Pills" Ambiguity (CHC vs. POP)
**The Dataset Limitation:** The NDHS dataset only contains a generic `"Pills"` category. It does not separate Combined Hormonal Contraceptives (CHC) from Progestogen-Only Pills (POP).
**The Clinical Reality:** CHC and POP have fundamentally different systemic hormone profiles, side effects, and strict contraindications. Treating them as the same in the ML layer is clinically dangerous.

### Implementation Directive
* **CHC (Combined Pills):** Map to the ML `"Pills"` bin.
* **POP (Mini-Pill):** Evaluate for MEC eligibility ONLY. Do **NOT** generate an ML discontinuation risk card for POP, as we lack the specific ground-truth data to predict it accurately.

**Code Mapping Required:**
* `Form Input: "Pills"` $\rightarrow$ `MEC: CHC` $\rightarrow$ `ML Bin: "Pills"` (Render ML Card)
* `Form Input: "POP"` $\rightarrow$ `MEC: POP` $\rightarrow$ `ML Bin: null` (Hide ML Card)

---

## 3. Issue 2: The "IUD" Ambiguity (Copper vs. Hormonal)
**The Dataset Limitation:** The NDHS dataset groups all IUDs into a single `"IUD"` category. 
**The Clinical Reality:** While Copper (Cu-IUD) and Hormonal (LNG-IUD) differ chemically, their behavioral discontinuation drivers (procedural pain, cramping, localized bleeding) are nearly identical. Therefore, they can share an ML behavioral baseline, but MUST remain separate for MEC clinical safety.

### Implementation Directive
Merge the redundant IUD form entries to prevent the UI from rendering two identical ML risk cards, but preserve the granular clinical split in the MEC layer.

**Code Mapping Required:**
1.  **Form Input:** Consolidate `Copper IUD` and `Intrauterine Device (IUD)` into a single dropdown option: `"Intrauterine Device (IUD)"`.
2.  **MEC Layer (`METHOD_ATTRIBUTES`):** Continue to evaluate `Cu-IUD` and `LNG-IUD` as strictly separate entities so rule-based contraindications (e.g., breast cancer for LNG-IUD) apply correctly.
3.  **ML Layer (`CONTRACEPTIVE_METHOD_MAP`):** Map the single form entry to the `"IUD"` OHE bin. 

---

## 4. Summary of Expected End-to-End Trace
When updating `ObAssessment.tsx`, `mecService.ts`, and `featureEncoder.ts`, ensure the data flows exactly like this:

| Form Entry | MEC ID (Layer 2) | ML Training Bin (Layer 3) | Render ML Card? |
| :--- | :--- | :--- | :--- |
| `Pills` | `CHC` | `"Pills"` | Yes |
| `POP` | `POP` | `null` | **No (MEC Only)** |
| `Injectable` | `DMPA` | `"Injectables"` | Yes |
| `Implant` | `Implant` | `"Implants"` | Yes |
| `Intrauterine Device (IUD)` | `LNG-IUD` & `Cu-IUD` | `"IUD"` | Yes |

*Note: The "Patch" option has been completely removed from the pipeline as it incorrectly encoded to "Withdrawal".*