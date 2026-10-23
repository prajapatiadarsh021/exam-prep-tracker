/**
 * Sample syllabi for the Syllabus-to-Exam Prep Tracker.
 * These are realistic, comprehensive syllabi spanning high-stakes university and certification domains.
 */

export const SAMPLE_SYLLABI = [
  {
    id: 'os-systems',
    title: 'Operating Systems & Concurrency',
    category: 'Computer Science',
    defaultDays: 7,
    defaultHours: 4,
    description: 'Processes, CPU Scheduling, Virtual Memory, Deadlocks & File Systems',
    syllabusText: `Unit 1: Process Management & CPU Scheduling
- Process states, process control blocks (PCB), and context switching
- CPU scheduling algorithms: FCFS, SJF, Priority, Round Robin, Multilevel Feedback Queues
- Inter-process communication (IPC): Shared memory, message passing, sockets

Unit 2: Process Synchronization & Concurrency
- Critical section problem, Peterson's algorithm, hardware instructions (Test-and-Set, Compare-and-Swap)
- Mutex locks, binary and counting semaphores, condition variables
- Classical synchronization problems: Bounded-Buffer, Readers-Writers, Dining Philosophers
- Deadlocks: Necessary conditions, resource allocation graphs, Banker's algorithm, deadlock detection & recovery

Unit 3: Memory Management & Virtual Memory
- Contiguous memory allocation, paging, segmentation, page table structures (multi-level, inverted, TLBs)
- Virtual memory concepts, demand paging, page fault handling mechanisms
- Page replacement algorithms: FIFO, Optimal, LRU, Second-chance/Clock, counting algorithms
- Thrashing, working-set model, page-fault frequency

Unit 4: Storage & File Systems
- Mass-storage structure, disk scheduling: FCFS, SCAN, C-SCAN, LOOK
- File system interface: access methods, directory structures, file mounting, file protection
- File system implementation: VFS, directory implementation, allocation methods (contiguous, linked, indexed), free-space management`
  },
  {
    id: 'dsa-gate',
    title: 'Data Structures & Algorithms Mastery',
    category: 'Computer Science',
    defaultDays: 10,
    defaultHours: 4.5,
    description: 'Arrays, Trees, Graphs, Dynamic Programming, and Greedy Algorithms',
    syllabusText: `Module 1: Advanced Arrays, Two Pointers & Hashing
- Prefix sums, sliding window optimization, two-pointer techniques
- Hash table collision resolution, amortized complexity, Robin Hood hashing
- Fast sorting algorithms: Merge sort, Quick sort, Heap sort, counting sort

Module 2: Trees, Binary Search Trees & Heaps
- Tree traversals (iterative & recursive), lowest common ancestor (LCA)
- Balanced BSTs (AVL tree rotations, Red-Black properties), B-Trees
- Binary heaps, priority queues, Huffman coding applications

Module 3: Graph Algorithms & Network Flows
- Graph representations, BFS, DFS, cycle detection in directed/undirected graphs
- Topological sorting, strongly connected components (Kosaraju & Tarjan)
- Minimum Spanning Trees (Kruskal & Prim), Shortest Paths (Dijkstra, Bellman-Ford, Floyd-Warshall)

Module 4: Dynamic Programming & Divide-and-Conquer
- Memoization vs Tabulation paradigms
- Classical 1D & 2D problems: Longest Common Subsequence (LCS), Knapsack variations, Matrix Chain Multiplication
- Dynamic programming on trees and bitmask DP basics`
  },
  {
    id: 'ml-foundations',
    title: 'Machine Learning & Deep Learning',
    category: 'AI & Data Science',
    defaultDays: 8,
    defaultHours: 3.5,
    description: 'Supervised learning, Optimization, Deep Neural Nets, Attention & Transformers',
    syllabusText: `Chapter 1: Supervised Learning & Statistical Foundations
- Linear regression, ordinary least squares, ridge & lasso regularization (L1/L2)
- Logistic regression, cross-entropy loss, maximum likelihood estimation (MLE)
- Support Vector Machines (SVM): Hyperplanes, soft margin, kernel trick (RBF, polynomial)
- Bias-variance trade-off, cross-validation, precision/recall, ROC-AUC

Chapter 2: Optimization & Neural Network Architectures
- Gradient Descent variants: SGD, Momentum, RMSprop, Adam optimizer
- Multilayer perceptrons (MLP), forward pass, backpropagation calculus
- Activation functions: ReLU, Leaky ReLU, GELU, Sigmoid, Softmax
- Vanishing/exploding gradients, weight initialization (He, Xavier), Batch Normalization, Dropout

Chapter 3: Deep Representation Learning & Attention
- Convolutional Neural Networks (CNN): Convolution kernels, padding, pooling, receptive fields
- Recurrent neural networks (RNN), LSTM, GRU architectures
- Self-attention mechanism, scaled dot-product attention, multi-head attention
- Transformer encoder-decoder architecture, positional encodings, fine-tuning concepts`
  },
  {
    id: 'calc-linear-algebra',
    title: 'Calculus & Linear Algebra for Engineers',
    category: 'Mathematics',
    defaultDays: 6,
    defaultHours: 3,
    description: 'Matrix decompositions, Eigenvalues, Multivariable Calculus, Optimization',
    syllabusText: `Unit 1: Linear Systems & Vector Spaces
- Gaussian elimination, row echelon form, rank, nullity, fundamental subspaces
- Vector spaces, linear independence, basis, dimension, change of basis
- Inner products, orthogonality, Gram-Schmidt process, QR decomposition

Unit 2: Eigenvalues & Matrix Decompositions
- Characteristic polynomial, eigenvalues, eigenvectors, diagonalization
- Symmetric matrices, spectral theorem, positive definite matrices
- Singular Value Decomposition (SVD), principal component analysis (PCA) formulation

Unit 3: Multivariable Calculus & Gradient-Based Optimization
- Partial derivatives, gradient vectors, directional derivatives, tangent planes
- Jacobian and Hessian matrices, Taylor expansion in multiple variables
- Unconstrained optimization, critical points, saddle points, Lagrange multipliers for constrained optimization`
  }
];
