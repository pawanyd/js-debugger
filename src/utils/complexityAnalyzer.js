/**
 * Analyze time and space complexity from execution trace
 */
export function analyzeComplexity(trace) {
  if (!trace || trace.length === 0) {
    return {
      time: {
        notation: 'N/A',
        category: 'No execution',
        description: 'Run the code to see complexity analysis',
        steps: 0,
        functionCalls: 0,
      },
      space: {
        notation: 'N/A',
        category: 'No execution',
        description: 'Run the code to see complexity analysis',
        maxCallStack: 0,
        variablesCreated: 0,
      },
    };
  }

  // Analyze time complexity
  const totalSteps = trace.length;
  const functionCalls = trace.filter(step => step.type === 'call').length;
  const loops = trace.filter(step => step.type === 'loop').length;
  const arrayAccesses = trace.filter(step => 
    step.description && (
      step.description.includes('[') || 
      step.description.includes('array') ||
      step.description.includes('push') ||
      step.description.includes('pop')
    )
  ).length;
  
  // Analyze space complexity
  let maxCallStackDepth = 0;
  let totalVariables = 0;
  const variableNames = new Set();

  trace.forEach(step => {
    // Track max call stack depth
    if (step.callStack && step.callStack.length > maxCallStackDepth) {
      maxCallStackDepth = step.callStack.length;
    }

    // Track unique variables
    if (step.scopes) {
      step.scopes.forEach(scope => {
        if (scope.variables) {
          Object.keys(scope.variables).forEach(varName => {
            variableNames.add(varName);
          });
        }
      });
    }
  });

  totalVariables = variableNames.size;

  // Estimate time complexity
  let timeNotation = 'O(1)';
  let timeCategory = 'Constant';
  let timeDescription = 'Executes in constant time regardless of input size';

  if (loops > 0) {
    // Check for nested loops by tracking active loops
    let activeLoops = 0;
    let maxNesting = 0;
    
    trace.forEach((step) => {
      if (step.type === 'loop') {
        if (step.description.includes('started')) {
          activeLoops++;
          maxNesting = Math.max(maxNesting, activeLoops);
        } else if (step.description.includes('condition') && step.description.includes('false')) {
          // Loop ended
          activeLoops = Math.max(0, activeLoops - 1);
        }
      }
    });

    // Handle different nesting levels
    if (maxNesting >= 6) {
      timeNotation = `O(n⁶)`;
      timeCategory = 'Polynomial (degree 6)';
      timeDescription = `Contains ${maxNesting}-level nested loops - execution time grows with n to the power of ${maxNesting}`;
    } else if (maxNesting === 5) {
      timeNotation = 'O(n⁵)';
      timeCategory = 'Polynomial (degree 5)';
      timeDescription = 'Contains 5-level nested loops - execution time grows with n to the power of 5';
    } else if (maxNesting === 4) {
      timeNotation = 'O(n⁴)';
      timeCategory = 'Polynomial (degree 4)';
      timeDescription = 'Contains 4-level nested loops - execution time grows with n to the power of 4';
    } else if (maxNesting === 3) {
      timeNotation = 'O(n³)';
      timeCategory = 'Cubic';
      timeDescription = 'Contains triple-nested loops - execution time grows cubically with input size';
    } else if (maxNesting === 2) {
      timeNotation = 'O(n²)';
      timeCategory = 'Quadratic';
      timeDescription = 'Contains nested loops - execution time grows quadratically with input size';
    } else if (loops > 1) {
      timeNotation = 'O(n)';
      timeCategory = 'Linear';
      timeDescription = 'Contains multiple sequential loops - execution time grows linearly with input size';
    } else {
      timeNotation = 'O(n)';
      timeCategory = 'Linear';
      timeDescription = 'Contains a loop - execution time grows linearly with input size';
    }
  } else if (functionCalls > 10) {
    // Check for recursive patterns
    const callsByFunction = {};
    let maxRecursiveDepth = 0;
    let currentDepth = 0;
    let lastFunctionName = '';
    let recursiveCallCount = 0;
    
    trace.forEach((step, i) => {
      if (step.type === 'call') {
        const funcName = step.description.split('(')[0].replace('Calling ', '');
        callsByFunction[funcName] = (callsByFunction[funcName] || 0) + 1;
        
        // Track recursive depth by checking call stack
        if (step.callStack) {
          const depth = step.callStack.filter(call => call.name.includes(funcName)).length;
          maxRecursiveDepth = Math.max(maxRecursiveDepth, depth);
        }
        
        // Count recursive calls (same function called again)
        if (funcName === lastFunctionName) {
          recursiveCallCount++;
        }
        lastFunctionName = funcName;
      }
    });
    
    // Find the most called function
    const maxCalls = Math.max(...Object.values(callsByFunction));
    const recursiveFunctions = Object.entries(callsByFunction).filter(([_, count]) => count > 3);
    
    if (recursiveFunctions.length > 0 && maxRecursiveDepth > 2) {
      // Analyze recursion pattern
      const totalRecursiveCalls = recursiveFunctions.reduce((sum, [_, count]) => sum + count, 0);
      const avgCallsPerDepth = totalRecursiveCalls / maxRecursiveDepth;
      
      // Check if it's divide-and-conquer (like merge sort, binary search)
      // These typically have log(n) depth with multiple calls per level
      if (maxRecursiveDepth > 5 && avgCallsPerDepth > 1.5 && avgCallsPerDepth < 3) {
        timeNotation = 'O(n log n)';
        timeCategory = 'Linearithmic';
        timeDescription = `Divide-and-conquer algorithm (depth: ${maxRecursiveDepth}) - typical of merge sort, quick sort - execution time grows as n log n`;
      }
      // Check if it's exponential (like Fibonacci)
      // Multiple branches per call, calls grow exponentially
      else if (avgCallsPerDepth > 3 || totalRecursiveCalls > maxRecursiveDepth * 5) {
        timeNotation = 'O(2ⁿ)';
        timeCategory = 'Exponential';
        timeDescription = `Recursive function with multiple branches (depth: ${maxRecursiveDepth}) - typical of naive Fibonacci - execution time doubles with each input increase`;
      }
      // Linear recursion (like factorial, countdown)
      else {
        timeNotation = 'O(n)';
        timeCategory = 'Linear';
        timeDescription = `Linear recursive function (depth: ${maxRecursiveDepth}) - typical of factorial, countdown - execution time grows linearly with recursion depth`;
      }
    } else if (recursiveFunctions.length > 0) {
      timeNotation = 'O(n)';
      timeCategory = 'Linear';
      timeDescription = 'Recursive function - execution time grows linearly with recursion depth';
    } else {
      timeNotation = 'O(n)';
      timeCategory = 'Linear';
      timeDescription = 'Multiple function calls - execution time grows with number of operations';
    }
  } else if (totalSteps > 50) {
    timeNotation = 'O(n)';
    timeCategory = 'Linear';
    timeDescription = 'Multiple operations - execution time grows with input size';
  }

  // Estimate space complexity
  let spaceNotation = 'O(1)';
  let spaceCategory = 'Constant';
  let spaceDescription = 'Uses constant space regardless of input size';

  if (maxCallStackDepth > 5) {
    spaceNotation = 'O(n)';
    spaceCategory = 'Linear';
    spaceDescription = `Deep recursion (depth: ${maxCallStackDepth}) - space grows with recursion depth`;
  } else if (totalVariables > 10) {
    spaceNotation = 'O(n)';
    spaceCategory = 'Linear';
    spaceDescription = `Multiple variables (${totalVariables}) - space grows with data structures`;
  } else if (maxCallStackDepth > 1) {
    spaceNotation = 'O(1)';
    spaceCategory = 'Constant';
    spaceDescription = 'Uses a fixed amount of space with shallow call stack';
  }

  return {
    time: {
      notation: timeNotation,
      category: timeCategory,
      description: timeDescription,
      steps: totalSteps,
      functionCalls,
    },
    space: {
      notation: spaceNotation,
      category: spaceCategory,
      description: spaceDescription,
      maxCallStack: maxCallStackDepth,
      variablesCreated: totalVariables,
    },
  };
}
