const structuredDataPrompt = `You are an AI assistant that processes the following information about art appraisers and outputs it in a structured JSON format. 

---
[DATA BEGINS]

Here is the information about art appraisers we've collected:

1. Anderson Fine Art Appraisals (AFAA)
   - Specializes in European/American art, including Contemporary, Modern, Impressionist, and 19th-century works
   - Expert witness services, litigation support, authentication research
   - Decades of experience
   - Location: Los Angeles
   - Website: www.art-appraisals.net

2. Escher Associates (EA)
   - Founded in 1984 by Nancy Escher, ASA-certified
   - Specialties: Paintings, sculpture, photography, rare books
   - Fees: $350/hour or $2,500/day plus expenses
   - USPAP and ASA standards
   - Handled art fraud cases with LAPD
   - Website: www.escher-associates.com

3. Page Art, Inc.
   - Insurance, estates, donations, and litigation appraisals
   - Hourly rate: $350
   - Minimum for in-office consults: $500
   - Service areas: Los Angeles, Bay Area, Orange County, out-of-state
   - Credentials: ASA, ISA, or AAA
   - Website: www.page-art.com

4. Saylor Rice Appraisals
   - Clients: LACMA, MoMA
   - Insurance, damage/loss appraisals
   - Likely high-end
   - Website: www.saylorriceappraisals.com

5. Gurr Johns
   - Global firm, Los Angeles presence
   - High-value appraisals, expert witness
   - Manages over $10 billion annually, USPAP compliant
   - Website: www.gurrjohns.com

6. Mimesis Gallery
   - Offers free valuations and same-day offers in LA
   - Consignment-based sales 
   - Fees: 20% up to $500K, 10% beyond that
   - Location: Westwood Blvd, Los Angeles
   - Website: www.mimesisgallery.com

[DATA ENDS]
---

**Task**: 
- Convert the above data into **valid JSON**. 
- Each entry should be represented as an object in an array called \`"appraisers"\`. 
- For each entry, try to fill the following fields:

1. \`"name"\`
2. \`"specialties"\` (array or string)
3. \`"pricing"\` (array or string)
4. \`"services_offered"\` (array or string)
5. \`"certifications"\` (array or string)
6. \`"years_in_business"\` (string or number)
7. \`"city"\` (string)
8. \`"state"\` (string)
9. \`"phone"\` (string, if missing, leave empty or guess)
10. \`"website"\` (string)
11. \`"notes"\` (any extra details)

- If any info is missing or unclear, **either guess** based on context or **leave it blank** (e.g., an empty string or \`null\`).
- **Do not** provide additional commentary or formatting—output **only** valid JSON that can be parsed by our frontend.

### **Example of the desired JSON structure** (with dummy placeholders):
{ "appraisers": [ { "name": "Anderson Fine Art Appraisals", "specialties": ["European Art", "American Art", "Expert Witness"], "pricing": "Project-based", "services_offered": ["Litigation Support", "Authentication"], "certifications": [], "years_in_business": "Decades", "city": "Los Angeles", "state": "CA", "phone": "", "website": "www.art-appraisals.net", "notes": "..." }, ... ] }

**Please generate the JSON now, following the above instructions.**`;

module.exports = {
  structuredDataPrompt
};