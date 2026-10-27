import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const SAMPLE_BOOKS = [
  {
    title: 'Clean Architecture: A Craftsman\'s Guide',
    author: 'Robert C. Martin',
    category: 'Programming',
    isbn: '978-0134494166',
    publisher: 'Prentice Hall',
    publicationYear: 2017,
    sellingPrice: 899,
    costPrice: 580,
    stockQuantity: 18,
    lowStockThreshold: 5,
    coverImageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&auto=format&fit=crop&q=80',
    description: 'Practical software architecture rules and principles for building modular, maintainable systems.',
    active: true,
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Computer Science',
    isbn: '978-1449373320',
    publisher: 'O\'Reilly Media',
    publicationYear: 2017,
    sellingPrice: 1250,
    costPrice: 850,
    stockQuantity: 12,
    lowStockThreshold: 4,
    coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    description: 'The definitive guide to data storage, stream processing, reliability, scalability, and maintainability.',
    active: true,
  },
  {
    title: 'Introduction to Algorithms (CLRS 4th Ed)',
    author: 'Thomas H. Cormen, Charles E. Leiserson',
    category: 'Computer Science',
    isbn: '978-0262046305',
    publisher: 'MIT Press',
    publicationYear: 2022,
    sellingPrice: 1499,
    costPrice: 1050,
    stockQuantity: 3, // Low stock on purpose
    lowStockThreshold: 5,
    coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    description: 'Essential reference and textbook covering algorithmic design, analysis, and data structures.',
    active: true,
  },
  {
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James F. Kurose, Keith W. Ross',
    category: 'Computer Science',
    isbn: '978-0136681557',
    publisher: 'Pearson',
    publicationYear: 2020,
    sellingPrice: 799,
    costPrice: 520,
    stockQuantity: 8,
    lowStockThreshold: 4,
    coverImageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&auto=format&fit=crop&q=80',
    description: 'Application-layer down approach to Internet architecture, TCP/IP, and routing protocols.',
    active: true,
  },
  {
    title: 'The Pragmatic Programmer: 20th Anniversary Ed',
    author: 'David Thomas, Andrew Hunt',
    category: 'Programming',
    isbn: '978-0135957059',
    publisher: 'Addison-Wesley',
    publicationYear: 2019,
    sellingPrice: 950,
    costPrice: 620,
    stockQuantity: 14,
    lowStockThreshold: 5,
    coverImageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    description: 'Timeless craftsmanship wisdom covering career growth, testing, architecture, and coding mastery.',
    active: true,
  },
  {
    title: 'Wings of Fire: An Autobiography',
    author: 'A.P.J. Abdul Kalam, Arun Tiwari',
    category: 'Biography',
    isbn: '978-8173711466',
    publisher: 'Universities Press',
    publicationYear: 1999,
    sellingPrice: 295,
    costPrice: 180,
    stockQuantity: 25,
    lowStockThreshold: 6,
    coverImageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&auto=format&fit=crop&q=80',
    description: 'Inspiring life journey of Dr. A.P.J. Abdul Kalam, from Rameswaram to the presidency of India.',
    active: true,
  },
  {
    title: 'Steve Jobs: The Exclusive Biography',
    author: 'Walter Isaacson',
    category: 'Biography',
    isbn: '978-1451648539',
    publisher: 'Simon & Schuster',
    publicationYear: 2011,
    sellingPrice: 650,
    costPrice: 420,
    stockQuantity: 2, // Low stock on purpose
    lowStockThreshold: 4,
    coverImageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop&q=80',
    description: 'Riveting story of the roller-coaster life and searingly intense personality of a creative entrepreneur.',
    active: true,
  },
  {
    title: 'The Palace of Illusions',
    author: 'Chitra Banerjee Divakaruni',
    category: 'Fiction',
    isbn: '978-8184450125',
    publisher: 'Picador India',
    publicationYear: 2008,
    sellingPrice: 380,
    costPrice: 240,
    stockQuantity: 15,
    lowStockThreshold: 5,
    coverImageUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&auto=format&fit=crop&q=80',
    description: 'A reimagining of the world-famous Indian epic, the Mahabharata, told from Panchaali’s perspective.',
    active: true,
  },
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    category: 'Fiction',
    isbn: '978-0525559474',
    publisher: 'Viking',
    publicationYear: 2020,
    sellingPrice: 420,
    costPrice: 260,
    stockQuantity: 0, // Out of stock on purpose
    lowStockThreshold: 5,
    coverImageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop&q=80',
    description: 'Between life and death there is a library where shelves go on forever and every book provides an alternate life.',
    active: true,
  },
  {
    title: 'A Fine Balance',
    author: 'Rohinton Mistry',
    category: 'Fiction',
    isbn: '978-0571216543',
    publisher: 'Faber & Faber',
    publicationYear: 1995,
    sellingPrice: 499,
    costPrice: 310,
    stockQuantity: 11,
    lowStockThreshold: 3,
    coverImageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80',
    description: 'Masterpiece capturing the heart and spirit of human survival during the turbulent 1970s in India.',
    active: true,
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self-Development',
    isbn: '978-0735211292',
    publisher: 'Avery',
    publicationYear: 2018,
    sellingPrice: 480,
    costPrice: 300,
    stockQuantity: 30,
    lowStockThreshold: 8,
    coverImageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
    description: 'An easy and proven way to build good habits and break bad ones through tiny incremental changes.',
    active: true,
  },
  {
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Self-Development',
    isbn: '978-9390166268',
    publisher: 'Harriman House',
    publicationYear: 2020,
    sellingPrice: 350,
    costPrice: 210,
    stockQuantity: 22,
    lowStockThreshold: 5,
    coverImageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&auto=format&fit=crop&q=80',
    description: 'Timeless lessons on wealth, greed, and happiness doing well with money has little to do with how smart you are.',
    active: true,
  },
  {
    title: 'Operating System Concepts (10th Ed)',
    author: 'Abraham Silberschatz, Peter B. Galvin',
    category: 'Computer Science',
    isbn: '978-1119800361',
    publisher: 'Wiley',
    publicationYear: 2021,
    sellingPrice: 850,
    costPrice: 560,
    stockQuantity: 9,
    lowStockThreshold: 3,
    coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
    description: 'Fundamental principles of process management, virtual memory, concurrency, and security.',
    active: true,
  },
  {
    title: 'Deep Work: Rules for Focused Success',
    author: 'Cal Newport',
    category: 'Self-Development',
    isbn: '978-1455586691',
    publisher: 'Grand Central Publishing',
    publicationYear: 2016,
    sellingPrice: 450,
    costPrice: 280,
    stockQuantity: 16,
    lowStockThreshold: 5,
    coverImageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&auto=format&fit=crop&q=80',
    description: 'How to cultivate intense concentration and eliminate distractions in a distracted world.',
    active: true,
  }
];

export const SAMPLE_CUSTOMERS = [
  {
    name: 'Aarav Sharma',
    phone: '+91 98201 98201',
    email: 'aarav.sharma@example.com',
    notes: 'Computer science undergrad student, frequents algorithm and systems sections.',
  },
  {
    name: 'Priya Patel',
    phone: '+91 98765 43211',
    email: 'priya.patel@example.com',
    notes: 'Book club organizer, avid reader of Indian literary fiction and biographies.',
  },
  {
    name: 'Rohan Verma',
    phone: '+91 98112 23344',
    email: 'rohan.verma@example.com',
    notes: 'Software engineer, interested in system architecture and technical books.',
  },
  {
    name: 'Ananya Iyer',
    phone: '+91 97445 56677',
    email: 'ananya.iyer@example.com',
    notes: 'Regular reader of psychology, personal finance, and self-development titles.',
  }
];

export async function seedDemoData(currentUser: { uid: string; displayName?: string }): Promise<{
  booksCount: number;
  customersCount: number;
  salesCount: number;
}> {
  const batch = writeBatch(db);
  const now = new Date();
  const createdBooks: Array<{ id: string; book: typeof SAMPLE_BOOKS[0] }> = [];
  const createdCustomers: Array<{ id: string; name: string }> = [];

  // 1. Seed Books
  for (const book of SAMPLE_BOOKS) {
    const bookRef = doc(collection(db, 'books'));
    const bookDocData = {
      ...book,
      isDemo: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    batch.set(bookRef, bookDocData);
    createdBooks.push({ id: bookRef.id, book });

    // Initial stock movement
    if (book.stockQuantity > 0) {
      const movRef = doc(collection(db, 'inventoryMovements'));
      batch.set(movRef, {
        bookId: bookRef.id,
        bookTitleSnapshot: book.title,
        movementType: 'initial',
        quantityChange: book.stockQuantity,
        previousQuantity: 0,
        newQuantity: book.stockQuantity,
        reason: 'Initial stock intake (Fictional Demo Data)',
        isDemo: true,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || 'Administrator',
        createdAt: now.toISOString(),
      });
    }
  }

  // 2. Seed Customers
  for (const customer of SAMPLE_CUSTOMERS) {
    const custRef = doc(collection(db, 'customers'));
    batch.set(custRef, {
      ...customer,
      totalPurchases: 0,
      totalSpent: 0,
      isDemo: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    createdCustomers.push({ id: custRef.id, name: customer.name });
  }

  await batch.commit();

  // 3. Seed historical sales
  const saleBatch = writeBatch(db);
  const sampleSales = [
    { daysAgo: 4, customerIdx: 0, bookIdxs: [0, 4], method: 'upi' as const },
    { daysAgo: 3, customerIdx: 1, bookIdxs: [7, 5], method: 'cash' as const },
    { daysAgo: 2, customerIdx: 2, bookIdxs: [1], method: 'upi' as const },
    { daysAgo: 1, customerIdx: 3, bookIdxs: [10, 11], method: 'upi' as const },
    { daysAgo: 0, customerIdx: null, bookIdxs: [0], method: 'cash' as const },
  ];

  let invoiceIdx = 101;
  for (const saleDef of sampleSales) {
    const saleDate = new Date(now.getTime() - saleDef.daysAgo * 24 * 60 * 60 * 1000);
    const saleRef = doc(collection(db, 'sales'));
    const items = saleDef.bookIdxs.map(bIdx => {
      const b = createdBooks[bIdx];
      return {
        bookId: b.id,
        title: b.book.title,
        author: b.book.author,
        isbn: b.book.isbn,
        quantity: 1,
        unitPrice: b.book.sellingPrice,
        costPrice: b.book.costPrice,
        lineTotal: b.book.sellingPrice,
      };
    });

    const subtotal = items.reduce((acc, it) => acc + it.lineTotal, 0);
    const totalAmount = subtotal;
    const cust = saleDef.customerIdx !== null ? createdCustomers[saleDef.customerIdx] : null;

    saleBatch.set(saleRef, {
      invoiceNumber: `INV-2026-${invoiceIdx++}`,
      customerId: cust ? cust.id : null,
      customerNameSnapshot: cust ? cust.name : 'Walk-in Customer',
      items,
      subtotal,
      discount: 0,
      tax: 0,
      totalAmount,
      paymentMethod: saleDef.method,
      paymentStatus: 'completed',
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || 'Administrator',
      status: 'completed',
      isDemo: true,
      createdAt: saleDate.toISOString(),
    });

    if (cust) {
      const custDocRef = doc(db, 'customers', cust.id);
      saleBatch.update(custDocRef, {
        totalPurchases: 1,
        totalSpent: totalAmount,
      });
    }
  }

  await saleBatch.commit();

  return {
    booksCount: SAMPLE_BOOKS.length,
    customersCount: SAMPLE_CUSTOMERS.length,
    salesCount: sampleSales.length,
  };
}

export async function clearDemoData(): Promise<number> {
  let count = 0;
  const collections = ['books', 'customers', 'sales', 'inventoryMovements'];

  for (const colName of collections) {
    const q = query(collection(db, colName), where('isDemo', '==', true));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, colName, docSnap.id));
      count++;
    }
  }

  return count;
}
