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
    // Check for nested loops
    const nestedLoops = trace.filter((step, i) => {
      if (step.type === 'loop' && i > 0) {
        // Check if there's another loop in recent steps
        const recentSteps = trace.slice(Math.max(0, i - 10), i);
        return recentSteps.some(s => s.type === 'loop');
      }
      return false;
    }).length;

    if (nestedLoops > loops / 2) {
      timeNotation = 'O(n²)';
      timeCategory = 'Quadratic';
      timeDescription = 'Contains nested loops - execution time grows quadratically with input size';
    } else {
      timeNotation = 'O(n)';
      timeCategory = 'Linear';
      timeDescription = 'Contains loops - execution time grows linearly with input size';
    }
  } else if (functionCalls > 10) {
    // Check for recursive patterns
    const recursiveCalls = trace.filter((step, i) => {
      if (step.type === 'call' && i > 0) {
        const prevCalls = trace.slice(Math.max(0, i - 5), i)
          .filter(s => s.type === 'call' && s.description.includes(step.description.split('(')[0]));
        return prevCalls.length > 0;
      }
      return false;
    }).length;

    if (recursiveCalls > functionCalls / 3) {
      // Likely recursive
      if (recursiveCalls > 20) {
        timeNotation = 'O(2ⁿ)';
        timeCategory = 'Exponential';
        timeDescription = 'Recursive function with multiple branches - execution time grows exponentially';
      } else {
        timeNotation = 'O(n)';
        timeCategory = 'Linear';
        timeDescription = 'Recursive function - execution time grows linearly with recursion depth';
      }
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
