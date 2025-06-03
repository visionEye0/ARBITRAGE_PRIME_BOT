function getCombinations(array, groupSize) {
    const combinations = [];
    
    function generateCombinations(start, combo) {
        if (combo.length === groupSize) {
            combinations.push([...combo]);
            return;
        }
        
        for (let i = start; i < array.length; i++) {
            combo.push(array[i]);
            generateCombinations(i + 1, combo);
            combo.pop(); // Backtrack
        }
    }
    
    generateCombinations(0, []);
    return combinations;
}


module.exports={getCombinations}