

export function extractFloatToTwoDecimalPlaces(input: string): { value?: number, error?: string } {
    const parsed = parseFloat(input);
  
    if (isNaN(parsed)) {
        return { error: 'Invalid number format' };
    }
  
    const roundedValue = Math.round(parsed * 100) / 100; // Round to 2 decimal places
    return { value: roundedValue };
}


export function convertToSubCurrency(amount: string): { value?: number, error?: string } {
    const parsed = parseFloat(amount);

    // Check if parsed is a valid number
    if (isNaN(parsed)) {
      return { error: 'Invalid input: Not a valid number' };
    }
  
    // Ensure the number is rounded to 2 decimal places
    const rounded = Math.round(parsed * 100)

    return {value: rounded};

}