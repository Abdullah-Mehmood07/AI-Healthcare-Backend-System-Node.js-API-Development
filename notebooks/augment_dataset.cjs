const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'Healthcare_5000_with_Specialist.csv');
const outputPath = path.join(__dirname, '..', 'Healthcare_20000_Augmented.csv');
const targetRows = 20000;

console.log('Loading dataset from', inputPath);
const data = fs.readFileSync(inputPath, 'utf8');
const lines = data.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

const diseaseSymptoms = {};
const diseaseSpecialist = {};
let totalRows = 0;
const genderCounts = { Male: 0, Female: 0, Other: 0 };

rows.forEach(row => {
    // Basic CSV parsing
    const match = row.match(/^([^,]+),([^,]+),([^,]+),"([^"]+)",([^,]+),([^,]+),([^,]+)$/);
    if (!match) return;
    
    totalRows++;
    const [_, id, age, gender, symptomsStr, count, disease, specialist] = match;
    
    if (genderCounts[gender] !== undefined) genderCounts[gender]++;
    
    if (!diseaseSymptoms[disease]) diseaseSymptoms[disease] = new Set();
    diseaseSpecialist[disease] = specialist.trim();
    
    symptomsStr.split(',').forEach(s => diseaseSymptoms[disease].add(s.trim()));
});

const genders = ['Male', 'Female', 'Other'];
const genderProbs = genders.map(g => genderCounts[g] / totalRows);

function getRandomGender() {
    let r = Math.random();
    for (let i = 0; i < genders.length; i++) {
        if (r < genderProbs[i]) return genders[i];
        r -= genderProbs[i];
    }
    return genders[0];
}

function getRandomAge() {
    // Normalish distribution centered at 45
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return getRandomAge(); // resample between 0 and 1
    return Math.floor(num * 99) + 1; // 1 to 100
}

const diseases = Object.keys(diseaseSpecialist);
const newRows = [header];

console.log(`Generating ${targetRows} rows...`);

for (let i = 0; i < targetRows; i++) {
    const disease = diseases[Math.floor(Math.random() * diseases.length)];
    const specialist = diseaseSpecialist[disease];
    
    const age = getRandomAge();
    const gender = getRandomGender();
    
    const symptoms = Array.from(diseaseSymptoms[disease]);
    const numSymptoms = Math.max(3, Math.floor(Math.random() * 5) + 3); // 3 to 7
    
    // Shuffle and pick
    const shuffled = symptoms.sort(() => 0.5 - Math.random());
    const chosen = shuffled.slice(0, numSymptoms);
    const symptomsStr = `"${chosen.join(', ')}"`;
    
    newRows.push(`${i+1},${age},${gender},${symptomsStr},${chosen.length},${disease},${specialist}`);
}

fs.writeFileSync(outputPath, newRows.join('\n'));
console.log(`Saved augmented dataset to ${outputPath}`);
