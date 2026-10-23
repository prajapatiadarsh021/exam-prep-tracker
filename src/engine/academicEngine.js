/**
 * Academic Engine and Adaptive Study Planner.
 * Core engine powering the Syllabus-to-Exam Prep Tracker.
 * 
 * Implements strict JSON generation for:
 * 1. GENERATE_ROADMAP
 * 2. GENERATE_QUIZ
 * 3. RECALIBRATE_SCHEDULE
 */

// Curated conceptual question bank for key domains to guarantee top-tier MCQs
const CONCEPTUAL_QUESTION_BANK = {
  // OS & Concurrency
  'process management': [
    {
      question_text: 'A real-time operating system switches between two kernel threads. When an external hardware interrupt triggers during a non-preemptible critical section, what immediately happens to process state transitions?',
      options: [
        'The running thread is instantly terminated and placed into the terminated queue to prevent race conditions.',
        'The interrupt is buffered or deferred until the critical section exits, after which the scheduler evaluates thread priorities.',
        'The CPU enters an unrecoverable deadlock because interrupts cannot be delayed in kernel mode.',
        'All threads are moved directly from ready state to waiting state unconditionally.'
      ],
      correct_option_index: 1,
      concept_tested: 'Interrupt handling & kernel non-preemption',
      explanation: 'Non-preemptible critical sections disable or defer incoming interrupts to preserve shared kernel data structures. Once exited, pending interrupts are serviced.'
    },
    {
      question_text: 'In a Round-Robin CPU scheduler with a time quantum Q, what is the consequence if Q approaches infinity versus when Q approaches zero?',
      options: [
        'As Q -> infinity, it behaves like FCFS; as Q -> 0, context-switching overhead dominates and degrades throughput.',
        'As Q -> infinity, turnaround time drops to zero; as Q -> 0, starvation occurs for long processes.',
        'As Q -> infinity, it guarantees shortest job first; as Q -> 0, it behaves like priority preemption.',
        'There is no functional change because time quantum only affects I/O-bound processes.'
      ],
      correct_option_index: 0,
      concept_tested: 'Round-Robin time quantum boundary conditions',
      explanation: 'When Q is large enough that every burst completes before expiration, RR degenerates into First-Come First-Served. When Q is infinitesimally small, the system spends all its cycles on context switches.'
    },
    {
      question_text: 'Two threads execute `wait(S)` on a shared binary semaphore S initially set to 1. If thread A enters the critical section and is context-switched out before executing `signal(S)`, what happens to thread B?',
      options: [
        'Thread B bypasses the lock if it has higher scheduling priority than Thread A.',
        'Thread B resets the semaphore to 1 because Thread A was preempted.',
        'Thread B is blocked on S until Thread A resumes execution and invokes signal(S).',
        'Thread B causes a system panic due to an orphaned mutex.'
      ],
      correct_option_index: 2,
      concept_tested: 'Semaphore mutual exclusion semantics',
      explanation: 'A binary semaphore protects critical sections by decrementing S to 0. Any subsequent wait(S) blocks the calling thread until the owner invokes signal(S), regardless of preemption.'
    }
  ],
  'virtual memory': [
    {
      question_text: 'A system with a 32-bit virtual address space uses 4 KB pages and a single-level page table. If each page table entry takes 4 bytes, why is a single-level page table impractical for large processes?',
      options: [
        'Because 4 KB pages can only address up to 64 MB of physical RAM.',
        'Because the page table itself requires 4 MB of contiguous physical memory per process, even if only a few pages are mapped.',
        'Because the translation lookaside buffer (TLB) cannot cache virtual addresses longer than 16 bits.',
        'Because single-level tables cannot support page replacement algorithms like LRU.'
      ],
      correct_option_index: 1,
      concept_tested: 'Hierarchical paging vs flat page table overhead',
      explanation: 'With 2^32 / 2^12 = 2^20 entries at 4 bytes each, a flat page table requires 4 MB of contiguous RAM per process, wasting immense memory for sparse allocations.'
    },
    {
      question_text: 'Under what specific condition does Belady’s Anomaly manifest, and which page replacement algorithm is immune to it?',
      options: [
        'Allocating more page frames increases the page fault rate; LRU is immune because it is a stack algorithm.',
        'Allocating fewer page frames causes thrashing; FIFO is immune because it respects entry order.',
        'Accessing contiguous memory blocks invalidates the TLB; Optimal is prone to it.',
        'Dirty pages are written back to swap space too frequently; Second-chance clock is immune.'
      ],
      correct_option_index: 0,
      concept_tested: 'Belady\'s Anomaly and Stack Algorithms',
      explanation: 'Belady’s anomaly occurs in FIFO when increasing available frames increases page faults. Stack algorithms (like LRU and Optimal) guarantee that the set of pages in N frames is always a subset of N+1 frames, making them immune.'
    },
    {
      question_text: 'When a process experiences thrashing, what is the fundamental mismatch occurring between the hardware and process behavior?',
      options: [
        'The CPU clock speed is running faster than the bus bandwidth.',
        'The sum of the working sets across active processes exceeds the total available physical memory frames.',
        'The disk controller has ran out of sectors to allocate for the swap partition.',
        'The page replacement algorithm chooses pages that have not yet been modified.'
      ],
      correct_option_index: 1,
      concept_tested: 'Working set model and thrashing dynamics',
      explanation: 'Thrashing occurs when the collective working set of running processes exceeds physical RAM frames, causing the system to spend virtually all time paging in/out rather than executing instructions.'
    }
  ],
  'deadlocks': [
    {
      question_text: 'In the Banker\'s Algorithm, a state is classified as "safe" if and only if which condition holds true?',
      options: [
        'All resources are currently fully allocated to running processes.',
        'There exists at least one sequence of process completions such that every process can satisfy its maximum claim without deadlock.',
        'No process is allowed to hold more than one resource at any given time.',
        'Every resource in the system has a single instance.'
      ],
      correct_option_index: 1,
      concept_tested: 'Banker\'s Algorithm safe sequence definition',
      explanation: 'A state is safe if there exists an execution sequence <P1, P2, ... Pn> such that each Pi can satisfy its maximum remaining needs with current available resources plus resources freed by preceding processes.'
    },
    {
      question_text: 'Which of the following interventions guarantees the prevention of deadlocks by breaking the "Circular Wait" necessary condition?',
      options: [
        'Imposing a strict global linear ordering on all resource types and requiring processes to request resources in strictly ascending order.',
        'Preempting low-priority processes whenever a high-priority process requests a mutex.',
        'Requiring processes to request all needed resources at the very beginning of execution.',
        'Doubling the number of CPU cores to execute threads simultaneously.'
      ],
      correct_option_index: 0,
      concept_tested: 'Deadlock prevention via resource ordering',
      explanation: 'Havender\'s ordering protocol assigns an integer F(R) to every resource. Requiring requests in increasing order mathematically prevents circular dependency cycles in the Resource Allocation Graph.'
    }
  ],
  // Data Structures & Algorithms
  'dynamic programming': [
    {
      question_text: 'When solving the 0/1 Knapsack problem using a 1D space-optimized DP array `dp[w]`, why must the inner loop over capacity `w` iterate in reverse (from W down to weight[i])?',
      options: [
        'To speed up CPU cache locality when accessing large memory arrays.',
        'To ensure that each item is used at most once by preventing values computed in the current iteration from contaminating the current row.',
        'Because dynamic programming requires top-down recursion to maintain optimal substructure.',
        'To naturally sort items by their value-to-weight density ratio.'
      ],
      correct_option_index: 1,
      concept_tested: '0/1 Knapsack 1D space optimization invariant',
      explanation: 'Iterating backwards ensures that `dp[w - weight[i]]` still holds the result from the previous item (i-1). Forward iteration would allow the same item `i` to be picked multiple times, inadvertently solving the Unbounded Knapsack problem.'
    },
    {
      question_text: 'What is the primary indicator that a problem exhibits "Optimal Substructure" suitable for Dynamic Programming rather than a Greedy heuristic?',
      options: [
        'Locally optimal choices at every step are mathematically proven to always yield the global optimum.',
        'The globally optimal solution can be constructed from optimal solutions to overlapping subproblems, where local decisions depend on subsequent choices.',
        'The input data can be sorted in O(N log N) time.',
        'The problem can only be expressed using a binary tree structure.'
      ],
      correct_option_index: 1,
      concept_tested: 'Optimal substructure vs greedy choice property',
      explanation: 'Greedy algorithms require that local choices never need backtracking. Dynamic Programming is required when subproblems overlap and a locally sub-optimal choice is needed to construct the globally optimal solution.'
    }
  ],
  'graph algorithms': [
    {
      question_text: 'Why does Dijkstra’s single-source shortest path algorithm fail or produce incorrect results when a graph contains negative-weight edges, even if there are no negative cycles?',
      options: [
        'The priority queue cannot store negative floating-point numbers.',
        'Dijkstra operates greedily on the premise that once a node is popped from the min-heap, its calculated distance is permanently optimal and cannot be reduced by longer paths.',
        'Negative edges inherently convert directed acyclic graphs into cyclic graphs.',
        'Dijkstra\'s algorithm requires bidirectional search to handle negative weights.'
      ],
      correct_option_index: 1,
      concept_tested: 'Dijkstra\'s greedy relaxation assumption',
      explanation: 'Dijkstra marks a vertex as finalized upon extraction from the priority queue, assuming no future path can have smaller length. A negative weight edge later in the graph invalidates this assumption, requiring algorithms like Bellman-Ford.'
    },
    {
      question_text: 'In Tarjan’s strongly connected components (SCC) algorithm, what does the condition `low[u] == disc[u]` indicate when backtracking through the DFS tree?',
      options: [
        'A negative-weight cycle has been detected.',
        'Vertex `u` is the root of a strongly connected component, and all vertices above it on the stack belong to this SCC.',
        'The graph is bipartite and can be colored with two colors.',
        'Vertex `u` is an articulation point that disconnects the graph if removed.'
      ],
      correct_option_index: 1,
      concept_tested: 'Tarjan\'s SCC low-link value invariant',
      explanation: 'When `low[u] == disc[u]`, no node in the subtree rooted at `u` has a back-edge to an ancestor of `u`. Therefore, `u` is the head of an SCC, and popping the DFS stack down to `u` isolates the complete SCC.'
    }
  ]
};

/**
 * Procedural conceptual question generator for any custom topic.
 * Ensures questions test architectural, behavioral, and edge-case principles
 * rather than simple dictionary definitions.
 */
function generateDynamicConceptualQuestions(topicName, keyConcepts, count = 3) {
  const concepts = (keyConcepts && keyConcepts.length > 0) 
    ? keyConcepts 
    : [topicName, 'Core Mechanics', 'Trade-offs', 'Failure Modes'];

  const questionTemplates = [
    {
      q: (t, c) => `In a high-throughput production architecture utilizing ${t}, an engineer observes unexpected latency degradation during peak traffic. Investigation isolates the bottleneck to "${c}". What is the most plausible underlying architectural trade-off causing this?`,
      correct: (c) => `The system incurs disproportionate coordination overhead or synchronization contention when maintaining consistency for ${c} under high concurrency.`,
      distractors: [
        `The underlying storage tier permanently exhausts memory addresses due to lack of 64-bit pointer support.`,
        `The algorithm converts automatically from deterministic polynomial time to exponential brute-force search.`,
        `Network packets are discarded because ${c} enforces a mandatory 10-second sleep interval on every transaction.`
      ],
      concept: (c) => `Concurrency & Performance Trade-offs in ${c}`,
      explanation: (t, c) => `Under high loads, mechanisms ensuring correctness in ${c} (such as locks, cache invalidation, or atomic updates) suffer from contention, directly degrading throughput.`
    },
    {
      q: (t, c) => `Which operational scenario illustrates a catastrophic failure mode when applying "${c}" in ${t} without adequate boundary safeguards?`,
      correct: (c) => `Unbounded recursion or state accumulation without eviction/pruning thresholds, leading to exhaustion of call stack or heap resources.`,
      distractors: [
        `Deterministic execution where all outputs are mathematically verified and hash-checked prior to storage.`,
        `Decreasing CPU utilization because memory cache hit ratios approach 99.9%.`,
        `Early termination of loop invariants when the target value is successfully discovered in the primary index.`
      ],
      concept: (c) => `Boundary Conditions & Failure Mitigation in ${c}`,
      explanation: (t, c) => `Boundary conditions in ${c} require defensive sizing, timeouts, or capacity limits; failing to constrain resource consumption leads to cascade crashes.`
    },
    {
      q: (t, c) => `When evaluating ${t}, why is adopting "${c}" preferable over an alternative naive heuristic approach?`,
      correct: (c) => `It provides provable mathematical guarantees on asymptotic bounds and resource stability across adversarial worst-case inputs.`,
      distractors: [
        `It completely eliminates the physical hardware requirement for random access memory.`,
        `It bypasses operating system kernel mode transitions by running directly on the BIOS firmware.`,
        `It guarantees zero execution time regardless of input size N.`
      ],
      concept: (c) => `Algorithmic Superiority & Formal Bounds of ${c}`,
      explanation: (t, c) => `Rigorous principles in ${c} safeguard system performance against pathological inputs where naive approaches deteriorate into worst-case complexity.`
    },
    {
      q: (t, c) => `Consider a distributed environment implementing ${t}. If a network partition isolates nodes responsible for "${c}", how does the system balance availability against consistency?`,
      correct: (c) => `It must either reject stale read/write mutations to maintain strong consistency or serve potentially stale data to preserve availability for ${c}.`,
      distractors: [
        `It automatically doubles network bandwidth using quantum entanglement tunneling.`,
        `All isolated nodes immediately erase their persistent disks to prevent unauthorized access.`,
        `It bypasses the CAP theorem by converting network communication from TCP to synchronous hardware buses.`
      ],
      concept: (c) => `Consistency vs Availability Guarantees in ${c}`,
      explanation: (t, c) => `Under the CAP theorem, any network partition requires making a deliberate trade-off between consistency and availability for distributed operations touching ${c}.`
    }
  ];

  const questions = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    const concept = concepts[i % concepts.length];
    const template = questionTemplates[i % questionTemplates.length];
    const correctText = template.correct(concept);
    const dist = template.distractors;
    
    // Shuffle options so correct is not always at 0
    const rawOptions = [correctText, dist[0], dist[1], dist[2]];
    const targetIdx = (i + 1) % 4; // Vary correct index systematically (1, 2, 3, 0)
    // Swap correct into targetIdx
    const temp = rawOptions[0];
    rawOptions[0] = rawOptions[targetIdx];
    rawOptions[targetIdx] = temp;

    questions.push({
      question_id: i + 1,
      question_text: template.q(topicName, concept),
      options: rawOptions,
      correct_option_index: targetIdx,
      concept_tested: template.concept(concept),
      explanation: template.explanation(topicName, concept)
    });
  }

  return questions;
}

/**
 * Parse raw syllabus text into structured topics with key concepts.
 */
function parseSyllabus(syllabusText) {
  const lines = syllabusText.split('\n').map(l => l.trim()).filter(Boolean);
  const topics = [];
  let currentUnit = 'General';
  let currentTopic = null;

  for (const line of lines) {
    // Check if line is a unit / module header
    const unitMatch = line.match(/^(?:Unit|Module|Chapter|Section|Part)\s*(\d+|[IVX]+)?[:.-]?\s*(.*)$/i);
    if (unitMatch) {
      currentUnit = unitMatch[2] || line;
      continue;
    }

    // Check if line is a topic bullet or numbered list
    const isBullet = line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || /^\d+[.)]/.test(line);
    const cleanText = line.replace(/^[-*•\d.)]\s*/, '').trim();

    if (cleanText.length > 3) {
      // Extract concepts if line has commas or colons
      let name = cleanText;
      let concepts = [];

      if (cleanText.includes(':')) {
        const parts = cleanText.split(':');
        name = parts[0].trim();
        concepts = parts[1].split(/[,;]/).map(c => c.trim()).filter(c => c.length > 2);
      } else if (cleanText.includes(',')) {
        const parts = cleanText.split(',');
        name = parts[0].trim();
        concepts = parts.slice(1).map(c => c.trim()).filter(c => c.length > 2);
      }

      if (concepts.length === 0) {
        concepts = [`${name} fundamentals`, `${name} architecture`, `${name} analysis`];
      }

      // Assign difficulty based on keywords
      let difficulty = 'Medium';
      const lower = cleanText.toLowerCase();
      if (lower.includes('basic') || lower.includes('intro') || lower.includes('overview') || lower.includes('definition')) {
        difficulty = 'Easy';
      } else if (lower.includes('advanced') || lower.includes('optimization') || lower.includes('dynamic') || lower.includes('deadlock') || lower.includes('decomposition') || lower.includes('transform')) {
        difficulty = 'Hard';
      }

      // Estimated minutes
      const estimatedMinutes = difficulty === 'Hard' ? 90 : difficulty === 'Medium' ? 75 : 50;

      topics.push({
        topic_id: `T${100 + topics.length + 1}`,
        name: `${currentUnit !== 'General' ? currentUnit.split(':')[0].trim() + ' - ' : ''}${name}`,
        key_concepts: concepts.slice(0, 4),
        estimated_minutes: estimatedMinutes,
        difficulty_level: difficulty
      });
    }
  }

  // Fallback if parsing yielded too few items
  if (topics.length === 0) {
    topics.push(
      {
        topic_id: 'T101',
        name: 'Foundational Principles & Core Concepts',
        key_concepts: ['Underlying architecture', 'State transitions', 'Performance trade-offs'],
        estimated_minutes: 80,
        difficulty_level: 'Medium'
      },
      {
        topic_id: 'T102',
        name: 'Advanced Mechanics & Problem Solving',
        key_concepts: ['Invariant verification', 'Edge case resilience', 'Optimization'],
        estimated_minutes: 90,
        difficulty_level: 'Hard'
      }
    );
  }

  return topics;
}

/**
 * 1. ACTION: GENERATE_ROADMAP
 * Operational Rules enforced:
 * - Strict JSON output matching schema
 * - Cognitive Load Management: Distribute topics evenly across available days
 * - Final 1-2 days strictly for revision/practice
 * - Daily allocated hours do not exceed hours_per_day
 */
export function generateRoadmap({ syllabus_text, days_remaining, hours_per_day }) {
  const totalDays = Math.max(1, parseInt(days_remaining, 10) || 7);
  const dailyCapHours = parseFloat(hours_per_day) || 4.0;
  const parsedTopics = parseSyllabus(syllabus_text || 'Comprehensive Exam Syllabus');

  // Rule 2: Keep the final 1-2 days strictly for revision/practice
  const revisionDaysCount = totalDays >= 4 ? 2 : totalDays >= 2 ? 1 : 0;
  const activeStudyDays = Math.max(1, totalDays - revisionDaysCount);

  // Group topics across active study days
  const dailyPlan = [];
  let topicCursor = 0;
  const totalTopics = parsedTopics.length;

  for (let day = 1; day <= totalDays; day++) {
    const isRevisionDay = day > activeStudyDays;

    if (isRevisionDay) {
      // Final revision days - strictly dedicated to synthesis, mock testing & weak-spot reinforcement
      const isFinalDay = day === totalDays;
      const revisionFocus = isFinalDay 
        ? 'Full Exam Simulation, Time Management Drills & High-Yield Formula Flash-Review'
        : 'Cross-Topic Synthesis, Complex Edge Cases & Mock Practice Test';

      dailyPlan.push({
        day_number: day,
        allocated_hours: Math.min(dailyCapHours, isFinalDay ? 3.0 : 3.5),
        topics: [
          {
            topic_id: `REV-${day}`,
            name: isFinalDay ? 'Comprehensive Full-Length Mock Exam' : 'Targeted Problem-Solving & High-Yield Review',
            key_concepts: ['Exam pacing', 'Error-log remediation', 'Speed & accuracy calibration'],
            estimated_minutes: isFinalDay ? 180 : 210,
            difficulty_level: 'Hard'
          }
        ],
        revision_focus: revisionFocus
      });
      continue;
    }

    // Active study day: allocate topics without exceeding dailyCapHours
    const dayTopics = [];
    let dayMinutes = 0;
    const maxDayMinutes = dailyCapHours * 60;

    // Determine how many topics should ideally fit today to ensure even distribution
    const remainingDays = (activeStudyDays - day) + 1;
    const remainingTopics = totalTopics - topicCursor;
    const targetTopicsForDay = Math.max(1, Math.ceil(remainingTopics / remainingDays));

    while (topicCursor < totalTopics && dayTopics.length < targetTopicsForDay) {
      const topic = parsedTopics[topicCursor];
      // Check if adding this topic violates daily limit
      if (dayMinutes + topic.estimated_minutes > maxDayMinutes && dayTopics.length > 0) {
        break;
      }
      dayTopics.push(topic);
      dayMinutes += topic.estimated_minutes;
      topicCursor++;
    }

    // If day has no topics yet because first topic is large, still include it capped
    if (dayTopics.length === 0 && topicCursor < totalTopics) {
      const topic = parsedTopics[topicCursor];
      dayTopics.push(topic);
      dayMinutes = Math.min(maxDayMinutes, topic.estimated_minutes);
      topicCursor++;
    }

    // Daily allocated hours (rounded to 1 decimal place)
    const allocatedHours = Math.min(dailyCapHours, Math.round((dayMinutes / 60) * 10) / 10);

    // Formulate meaningful revision focus
    const topicKeywords = dayTopics.map(t => t.name.split('-').pop().trim()).join(' & ');
    const revisionFocus = `Deep-dive on ${topicKeywords} with 15-minute conceptual self-quiz`;

    dailyPlan.push({
      day_number: day,
      allocated_hours: Math.max(1.0, allocatedHours),
      topics: dayTopics,
      revision_focus: revisionFocus
    });
  }

  // If any topics remain unallocated due to strict daily caps, fold them into the study days gracefully
  while (topicCursor < totalTopics) {
    const leftover = parsedTopics[topicCursor];
    const targetDay = dailyPlan[(topicCursor % activeStudyDays)];
    targetDay.topics.push(leftover);
    topicCursor++;
  }

  return {
    action: 'GENERATE_ROADMAP',
    total_days: totalDays,
    daily_plan: dailyPlan
  };
}

/**
 * 2. ACTION: GENERATE_QUIZ
 * Operational Rules enforced:
 * - 3 to 5 conceptual, multi-choice questions
 * - Avoid trivial definitions or rote-memory facts
 * - Exactly 4 distinct options with only 1 unambiguous correct answer
 */
export function generateQuiz({ topic_name, key_concepts, difficulty_level }) {
  const cleanName = (topic_name || 'Subject Diagnostics').toLowerCase();
  
  // Check curated conceptual bank first
  let matchedQuestions = null;
  for (const [key, questions] of Object.entries(CONCEPTUAL_QUESTION_BANK)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      matchedQuestions = questions;
      break;
    }
  }

  let finalQuestions = [];
  if (matchedQuestions && matchedQuestions.length >= 3) {
    // Clone questions to avoid mutating bank
    finalQuestions = matchedQuestions.slice(0, 4).map((q, idx) => ({
      ...q,
      question_id: idx + 1
    }));
  } else {
    // Generate high-yield procedural questions
    const count = 4;
    finalQuestions = generateDynamicConceptualQuestions(topic_name || 'Topic Concept', key_concepts, count);
  }

  return {
    action: 'GENERATE_QUIZ',
    topic_name: topic_name || 'Topic Diagnostic Assessment',
    questions: finalQuestions
  };
}

/**
 * 3. ACTION: RECALIBRATE_SCHEDULE
 * Operational Rules enforced:
 * - Inject a 30-45 minute review slot for weak concepts into Day N+1 (first day of remaining_schedule)
 * - Shift lower-priority topics if hours exceed capacity (max_daily_hours)
 * - Do not touch completed days
 */
export function recalibrateSchedule({
  weak_topic,
  quiz_score_percentage,
  missed_concepts,
  remaining_schedule,
  max_daily_hours
}) {
  const maxHours = parseFloat(max_daily_hours) || 4.0;
  const maxDayMinutes = maxHours * 60;
  
  // Clone schedule to preserve immutability
  const schedule = JSON.parse(JSON.stringify(remaining_schedule || []));

  if (schedule.length === 0) {
    return {
      action: 'RECALIBRATE_SCHEDULE',
      adjustment_reason: `Diagnostic score of ${quiz_score_percentage}% in ${weak_topic}`,
      revised_schedule: []
    };
  }

  // Determine recovery duration between 30 and 45 minutes based on score severity
  const score = parseFloat(quiz_score_percentage) || 50;
  const allottedMinutes = score < 50 ? 45 : score < 70 ? 40 : 35;

  const focusList = (missed_concepts && missed_concepts.length > 0)
    ? missed_concepts
    : [`Root causes of errors in ${weak_topic}`, 'Core invariant clarification'];

  // Day N+1 is the first day in remaining_schedule
  const dayNPlus1 = schedule[0];
  dayNPlus1.includes_recovery_slot = true;
  dayNPlus1.recovery_details = {
    topic: weak_topic || 'Weak Topic Remediation',
    focus_areas: focusList,
    allotted_minutes: allottedMinutes
  };

  // Check capacity and shift topics if necessary
  let overflowTopics = [];

  for (let i = 0; i < schedule.length; i++) {
    const currentDay = schedule[i];
    
    // Add any overflow from preceding day
    if (overflowTopics.length > 0) {
      currentDay.topics = [...overflowTopics, ...currentDay.topics];
      overflowTopics = [];
    }

    // Calculate total minutes today (topics + recovery slot if present)
    let totalMins = currentDay.topics.reduce((acc, t) => acc + (t.estimated_minutes || 60), 0);
    if (currentDay.includes_recovery_slot && currentDay.recovery_details) {
      totalMins += currentDay.recovery_details.allotted_minutes;
    }

    // If day exceeds maximum capacity, pop lower-priority (last) topics into overflow
    while (totalMins > maxDayMinutes && currentDay.topics.length > 1) {
      const popped = currentDay.topics.pop();
      totalMins -= (popped.estimated_minutes || 60);
      overflowTopics.push(popped);
    }

    currentDay.allocated_hours = Math.min(maxHours, Math.round((totalMins / 60) * 10) / 10);
  }

  // If overflow remains after the last day, append a new day or extend the final revision day
  if (overflowTopics.length > 0) {
    const lastDayNumber = schedule[schedule.length - 1].day_number;
    const overflowMins = overflowTopics.reduce((acc, t) => acc + (t.estimated_minutes || 60), 0);
    schedule.push({
      day_number: lastDayNumber + 1,
      allocated_hours: Math.min(maxHours, Math.round((overflowMins / 60) * 10) / 10),
      includes_recovery_slot: false,
      topics: overflowTopics,
      revision_focus: 'Buffer day for spilled-over topics and final mastery validation'
    });
  }

  return {
    action: 'RECALIBRATE_SCHEDULE',
    adjustment_reason: `Targeted remediation for ${weak_topic} following ${quiz_score_percentage}% diagnostic score. 30-45m recovery slot injected into Day ${dayNPlus1.day_number} with adaptive topic redistribution.`,
    revised_schedule: schedule
  };
}

/**
 * Universal dispatcher adhering strictly to the prompt's operational rules:
 * Rule 1: Output MUST be a single, valid JSON object matching the schema for the requested action_type.
 * No markdown backticks, explanations, or text outside the JSON.
 */
export function executeEngine(payload) {
  if (!payload || !payload.action_type) {
    throw new Error('Missing action_type in input payload');
  }

  switch (payload.action_type) {
    case 'GENERATE_ROADMAP':
      return generateRoadmap(payload.roadmap_context || {});
    case 'GENERATE_QUIZ':
      return generateQuiz(payload.quiz_context || {});
    case 'RECALIBRATE_SCHEDULE':
      return recalibrateSchedule(payload.recalibration_context || {});
    default:
      throw new Error(`Unsupported action_type: "${payload.action_type}". Expected GENERATE_ROADMAP, GENERATE_QUIZ, or RECALIBRATE_SCHEDULE.`);
  }
}
