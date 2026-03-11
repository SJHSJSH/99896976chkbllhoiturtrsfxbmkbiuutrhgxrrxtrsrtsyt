import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("academy.db");

// Initialize Database
db.exec(`
  DROP TABLE IF EXISTS questions;
  DROP TABLE IF EXISTS quizzes;
  DROP TABLE IF EXISTS notes;
  DROP TABLE IF EXISTS lessons;
  DROP TABLE IF EXISTS courses;

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT,
    lessons INTEGER,
    image TEXT,
    price INTEGER,
    oldPrice INTEGER,
    type TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    title TEXT,
    duration TEXT,
    note_content TEXT,
    video_url TEXT,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    lessons INTEGER,
    category TEXT,
    content TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    topic TEXT
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT,
    text TEXT,
    options TEXT,
    correctAnswer INTEGER,
    explanation TEXT,
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
  );
`);

// Seed Initial Data
const insertCourse = db.prepare("INSERT INTO courses (id, title, lessons, image, price, oldPrice, type, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
insertCourse.run('1', 'Class 10 Chemistry: Chemical Reactions', 12, 'https://images.unsplash.com/photo-1603126738414-697ee55d119c?auto=format&fit=crop&w=800&q=80', 0, 0, 'free', 'Chemistry');
insertCourse.run('2', 'Physics: Light & Reflection', 15, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80', 0, 0, 'free', 'Physics');
insertCourse.run('3', 'Biology: Life Processes', 18, 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80', 0, 0, 'free', 'Biology');
insertCourse.run('4', 'Mathematics: Trigonometry', 20, 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80', 0, 0, 'free', 'Maths');
insertCourse.run('5', 'NEET/JEE Chemistry: Organic Chemistry', 120, 'https://images.unsplash.com/photo-1532187875605-1ef6c237ddc4?auto=format&fit=crop&w=800&q=80', 4999, 14999, 'premium', 'Chemistry');
insertCourse.run('6', 'NEET/JEE Physics: Mechanics', 150, 'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45?auto=format&fit=crop&w=800&q=80', 5999, 19999, 'premium', 'Physics');
insertCourse.run('7', 'Full Chemistry Course', 36, 'https://images.unsplash.com/photo-1532634993-15f421e42ec0?auto=format&fit=crop&w=800&q=80', 0, 0, 'free', 'Chemistry');
insertCourse.run('8', 'Full Physics Course', 40, 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80', 0, 0, 'free', 'Physics');
insertCourse.run('9', 'Full Mathematics Course', 42, 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80', 0, 0, 'free', 'Mathematics');
insertCourse.run('10', 'Full Computer Course', 32, 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80', 0, 0, 'free', 'Computer Science');
insertCourse.run('11', 'Chemistry 2.0', 96, 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80', 6999, 19999, 'premium', 'Chemistry');
insertCourse.run('12', 'Physics 2.0', 110, 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80', 7499, 21999, 'premium', 'Physics');
insertCourse.run('13', 'Mathematics 2.0', 108, 'https://images.unsplash.com/photo-1509869175650-a1d97972541a?auto=format&fit=crop&w=800&q=80', 6499, 18999, 'premium', 'Mathematics');
insertCourse.run('14', 'Computer Science 2.0', 90, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80', 6999, 20999, 'premium', 'Computer Science');

const insertLesson = db.prepare("INSERT INTO lessons (id, course_id, title, duration, note_content, video_url) VALUES (?, ?, ?, ?, ?, ?)");
// Course 1: Chemistry
insertLesson.run('l1', '1', 'Chemical Equations & Balancing', '15:30', 'A chemical equation is the symbolic representation of a chemical reaction. Reactants are written on the left, and products on the right. Balancing ensures the Law of Conservation of Mass is followed.', 'https://www.youtube.com/embed/eEivS2z6v_8');
insertLesson.run('l2', '1', 'Types of Chemical Reactions', '22:15', '1. Combination: Two or more substances combine to form a single product.\n2. Decomposition: A single reactant breaks down into simpler products.\n3. Displacement: A more reactive element displaces a less reactive one.', 'https://www.youtube.com/embed/g-biRwAVTV8');
insertLesson.run('l3', '1', 'Oxidation and Reduction', '18:45', 'Oxidation is the gain of oxygen or loss of hydrogen. Reduction is the loss of oxygen or gain of hydrogen. Redox reactions involve both simultaneously.', 'https://www.youtube.com/embed/5rtJdjas-mY');

// Course 2: Physics
insertLesson.run('l4', '2', 'Reflection of Light', '12:00', 'Reflection is the bouncing back of light when it strikes a polished surface. Laws of reflection: 1. Angle of incidence = Angle of reflection. 2. Incident ray, reflected ray, and normal lie in the same plane.', 'https://www.youtube.com/embed/v_7y9V7_DkY');
insertLesson.run('l5', '2', 'Spherical Mirrors', '25:30', 'Concave mirrors are converging, while convex mirrors are diverging. The mirror formula is 1/f = 1/v + 1/u.', 'https://www.youtube.com/embed/7zv-4Zh-9R4');

// Course 7: Full Chemistry Course
insertLesson.run('l6', '7', 'Atomic Structure Basics', '19:20', 'Study subatomic particles, atomic number, mass number, isotopes, and electronic configuration.', 'https://www.youtube.com/embed/QoU8R9PHN5c');
insertLesson.run('l7', '7', 'Periodic Table and Trends', '23:10', 'Learn groups, periods, valency, atomic radius, electronegativity, and metallic character trends.', 'https://www.youtube.com/embed/0RRVV4Diomg');
insertLesson.run('l8', '7', 'Acids, Bases and Salts', '21:45', 'Understand pH scale, indicators, neutralization, common salts, and daily-life applications.', 'https://www.youtube.com/embed/9s3sW0nG3hE');

// Course 8: Full Physics Course
insertLesson.run('l9', '8', 'Motion and Speed', '18:05', 'Covers distance, displacement, speed, velocity, acceleration, and graphs of motion.', 'https://www.youtube.com/embed/6F8V1x8V6jE');
insertLesson.run('l10', '8', 'Force and Newton Laws', '24:15', 'Understand inertia, momentum, Newton laws of motion, and common numerical problems.', 'https://www.youtube.com/embed/kKKM8Y-u7ds');
insertLesson.run('l11', '8', 'Work, Energy and Power', '20:40', 'Learn kinetic energy, potential energy, work-energy theorem, and power calculations.', 'https://www.youtube.com/embed/M4H6khWqh8s');

// Course 9: Full Mathematics Course
insertLesson.run('l12', '9', 'Linear Equations', '17:30', 'Covers solving one-variable equations, balancing methods, and word problems.', 'https://www.youtube.com/embed/g7Z2D5Df3Y8');
insertLesson.run('l13', '9', 'Trigonometry Fundamentals', '26:10', 'Learn trigonometric ratios, standard values, identities, and practical applications.', 'https://www.youtube.com/embed/5PcpBw5Hbwo');
insertLesson.run('l14', '9', 'Mensuration and Geometry', '22:35', 'Study area, volume, circles, polygons, and basic geometry theorem use-cases.', 'https://www.youtube.com/embed/4M1Yv1Aas0A');

// Course 10: Full Computer Course
insertLesson.run('l15', '10', 'Computer Fundamentals', '16:45', 'Introduction to hardware, software, operating systems, memory, and storage devices.', 'https://www.youtube.com/embed/OAx_6-wdslM');
insertLesson.run('l16', '10', 'Internet and Cyber Safety', '18:20', 'Covers browsers, search, email, phishing, strong passwords, and safe online habits.', 'https://www.youtube.com/embed/inWWhr5tnEA');
insertLesson.run('l17', '10', 'Programming Logic Basics', '24:00', 'Learn algorithms, flowcharts, variables, loops, and conditional thinking for coding.', 'https://www.youtube.com/embed/zOjov-2OZ0E');

// Course 11: Chemistry 2.0
insertLesson.run('l18', '11', 'Organic Chemistry Masterclass', '32:15', 'Advanced coverage of hydrocarbons, functional groups, nomenclature, and reaction pathways.', 'https://www.youtube.com/embed/4ZBs5JxQY3Y');
insertLesson.run('l19', '11', 'Electrochemistry Deep Dive', '29:50', 'Detailed study of redox reactions, electrolysis, cells, and electrode potentials.', 'https://www.youtube.com/embed/5s25Pq9Wj3M');
insertLesson.run('l20', '11', 'Numerical Chemistry Practice', '27:20', 'Practice session focused on mole concept, concentration, stoichiometry, and gas law numericals.', 'https://www.youtube.com/embed/Gyd3C6l2NJE');

// Course 12: Physics 2.0
insertLesson.run('l21', '12', 'Advanced Mechanics', '34:05', 'Master motion in one and two dimensions, vectors, friction, and free body diagrams.', 'https://www.youtube.com/embed/2QbM3N0Bq4s');
insertLesson.run('l22', '12', 'Current Electricity', '30:35', 'Study current, resistance, Ohm law, circuit combinations, and power dissipation.', 'https://www.youtube.com/embed/6Y7dV4xv8J0');
insertLesson.run('l23', '12', 'Ray Optics and Numericals', '28:55', 'Detailed lesson on mirrors, lenses, sign convention, and exam-focused numericals.', 'https://www.youtube.com/embed/VB8mJH2m7eQ');

// Course 13: Mathematics 2.0
insertLesson.run('l24', '13', 'Algebra Problem Solving', '31:10', 'Deep practice on equations, polynomials, factorization, and quadratic applications.', 'https://www.youtube.com/embed/3F1r4XHc84I');
insertLesson.run('l25', '13', 'Coordinate Geometry', '27:45', 'Learn distance formula, section formula, slope, and line equations with examples.', 'https://www.youtube.com/embed/_M3P5ZLq6A8');
insertLesson.run('l26', '13', 'Probability and Statistics', '29:00', 'Focused revision on mean, median, mode, probability rules, and sample questions.', 'https://www.youtube.com/embed/xr7C4s7JZ8Y');

// Course 14: Computer Science 2.0
insertLesson.run('l27', '14', 'Python Programming Essentials', '33:30', 'Build strong fundamentals in syntax, variables, loops, functions, and lists.', 'https://www.youtube.com/embed/rfscVS0vtbw');
insertLesson.run('l28', '14', 'Data Structures Basics', '30:10', 'Understand arrays, stacks, queues, linked lists, and when to use each structure.', 'https://www.youtube.com/embed/RBSGKlAvoiM');
insertLesson.run('l29', '14', 'Web Development Starter', '28:25', 'Introduction to HTML, CSS, JavaScript, and building a basic responsive web page.', 'https://www.youtube.com/embed/UB1O30fR-EE');

const insertNote = db.prepare("INSERT INTO notes (id, title, lessons, category, content) VALUES (?, ?, ?, ?, ?)");
insertNote.run('n1', 'Class 10 Chemistry Formula Sheet', 1, 'Chemistry', '# Chemistry Formulas\n\n- **Molarity (M)**: moles of solute / liters of solution\n- **Molality (m)**: moles of solute / kg of solvent\n- **Ideal Gas Law**: PV = nRT\n- **pH**: -log[H+]');
insertNote.run('n2', 'Physics: Light Summary Notes', 1, 'Physics', '# Light & Reflection\n\n- **Mirror Formula**: 1/f = 1/v + 1/u\n- **Magnification**: m = -v/u = h\'/h\n- **Refractive Index**: n = c/v');
insertNote.run('n3', 'Biology: Life Processes PDF', 1, 'Biology', '# Life Processes\n\n1. **Nutrition**: Autotrophic and Heterotrophic\n2. **Respiration**: Aerobic and Anaerobic\n3. **Transportation**: Xylem and Phloem in plants\n4. **Excretion**: Nephrons in kidneys');

const insertUser = db.prepare("INSERT OR IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)");
insertUser.run('u1', 'Rahul Sharma', 'rahul@example.com', '123456');

const insertQuiz = db.prepare("INSERT INTO quizzes (id, topic) VALUES (?, ?)");
insertQuiz.run('q1', 'Chemistry');
insertQuiz.run('q2', 'Physics');
insertQuiz.run('q3', 'Biology');
insertQuiz.run('q4', 'Mathematics');
insertQuiz.run('q5', 'English');
insertQuiz.run('q6', 'History');
insertQuiz.run('q7', 'Computer Science');

const insertQuestion = db.prepare("INSERT INTO questions (id, quiz_id, text, options, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?)");
// Chemistry Quiz
insertQuestion.run('qn1', 'q1', 'Which of the following is a decomposition reaction?', JSON.stringify(['H2 + O2 -> H2O', 'CaCO3 -> CaO + CO2', 'Zn + HCl -> ZnCl2 + H2', 'NaOH + HCl -> NaCl + H2O']), 1, 'Decomposition reaction is a reaction in which a single reactant breaks down into two or more products. CaCO3 -> CaO + CO2 is a classic example.');
insertQuestion.run('qn2', 'q1', 'What is the pH of a neutral solution?', JSON.stringify(['0', '14', '7', '1']), 2, 'A neutral solution has a pH of 7. Values below 7 are acidic, and values above 7 are basic.');
insertQuestion.run('qn3', 'q1', 'Which gas is evolved when zinc reacts with dilute sulphuric acid?', JSON.stringify(['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Nitrogen']), 1, 'Zinc reacts with sulphuric acid to produce zinc sulphate and hydrogen gas (Zn + H2SO4 -> ZnSO4 + H2).');

// Physics Quiz
insertQuestion.run('qn4', 'q2', 'The focal length of a plane mirror is:', JSON.stringify(['Zero', 'Infinite', '25 cm', '-25 cm']), 1, 'A plane mirror has no curvature, so its focal length is considered infinite.');
insertQuestion.run('qn5', 'q2', 'The unit of power of a lens is:', JSON.stringify(['Meter', 'Dioptre', 'Watt', 'Joule']), 1, 'Power of a lens is the reciprocal of its focal length in meters, and its SI unit is Dioptre (D).');
insertQuestion.run('qn6', 'q2', 'Which mirror is used as a rear-view mirror in vehicles?', JSON.stringify(['Concave', 'Convex', 'Plane', 'None']), 1, 'Convex mirrors provide a wider field of view and always form an erect (though diminished) image, making them ideal for rear-view mirrors.');

// Biology Quiz
insertQuestion.run('qn7', 'q3', 'Which part of the cell is known as the control center?', JSON.stringify(['Nucleus', 'Cytoplasm', 'Cell membrane', 'Ribosome']), 0, 'The nucleus contains genetic material and regulates cell activities, so it is called the control center of the cell.');
insertQuestion.run('qn8', 'q3', 'Photosynthesis mainly takes place in which part of the plant cell?', JSON.stringify(['Mitochondria', 'Chloroplast', 'Vacuole', 'Nucleus']), 1, 'Chloroplasts contain chlorophyll and are the main site of photosynthesis in plant cells.');
insertQuestion.run('qn9', 'q3', 'Which blood vessel carries blood away from the heart?', JSON.stringify(['Vein', 'Capillary', 'Artery', 'Nerve']), 2, 'Arteries carry blood away from the heart, while veins return blood back to the heart.');

// Mathematics Quiz
insertQuestion.run('qn10', 'q4', 'What is the value of sin 90°?', JSON.stringify(['0', '1', '1/2', '√3/2']), 1, 'The standard trigonometric value of sin 90° is 1.');
insertQuestion.run('qn11', 'q4', 'If x + 7 = 15, what is the value of x?', JSON.stringify(['6', '7', '8', '9']), 2, 'Subtracting 7 from both sides gives x = 8.');
insertQuestion.run('qn12', 'q4', 'What is the area of a rectangle with length 8 cm and breadth 5 cm?', JSON.stringify(['13 cm²', '26 cm²', '40 cm²', '80 cm²']), 2, 'Area of a rectangle is length × breadth, so 8 × 5 = 40 cm².');

// English Quiz
insertQuestion.run('qn13', 'q5', 'Which of the following is a noun?', JSON.stringify(['Quickly', 'Beautiful', 'Honesty', 'Run']), 2, 'A noun names a person, place, thing, or idea. "Honesty" is an abstract noun.');
insertQuestion.run('qn14', 'q5', 'Choose the correct synonym of "rapid".', JSON.stringify(['Slow', 'Fast', 'Weak', 'Silent']), 1, 'Rapid means fast or quick.');
insertQuestion.run('qn15', 'q5', 'Which sentence is in the past tense?', JSON.stringify(['She sings well.', 'They are playing.', 'He went to school.', 'I will call you.']), 2, 'The verb "went" is the past form of "go", so the sentence is in the past tense.');

// History Quiz
insertQuestion.run('qn16', 'q6', 'Who was the first Prime Minister of independent India?', JSON.stringify(['Mahatma Gandhi', 'Sardar Patel', 'Jawaharlal Nehru', 'Subhas Chandra Bose']), 2, 'Jawaharlal Nehru became the first Prime Minister of independent India in 1947.');
insertQuestion.run('qn17', 'q6', 'In which year did India gain independence?', JSON.stringify(['1945', '1947', '1950', '1952']), 1, 'India became independent on August 15, 1947.');
insertQuestion.run('qn18', 'q6', 'The Harappan civilization is also known as the:', JSON.stringify(['Vedic civilization', 'Indus Valley civilization', 'Mauryan civilization', 'Gupta civilization']), 1, 'Harappan civilization is another name for the Indus Valley civilization.');

// Computer Science Quiz
insertQuestion.run('qn19', 'q7', 'What does CPU stand for?', JSON.stringify(['Central Processing Unit', 'Computer Primary Unit', 'Central Program Utility', 'Control Processing Utility']), 0, 'CPU stands for Central Processing Unit, the main processing component of a computer.');
insertQuestion.run('qn20', 'q7', 'Which of the following is an output device?', JSON.stringify(['Keyboard', 'Mouse', 'Monitor', 'Scanner']), 2, 'A monitor displays information from the computer, so it is an output device.');
insertQuestion.run('qn21', 'q7', 'Binary language uses which two digits?', JSON.stringify(['0 and 1', '1 and 2', '2 and 3', '0 and 9']), 0, 'Binary is a base-2 number system that uses only 0 and 1.');

async function startServer() {
  const app = express();
  const PORT = 3000;
  const findUserByEmail = db.prepare("SELECT * FROM users WHERE email = ?");
  const createUser = db.prepare("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)");

  app.use(express.json());

  app.post("/api/signup", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    const existingUser = findUserByEmail.get(email) as { id: string } | undefined;
    if (existingUser) {
      res.status(409).json({ success: false, message: "Email already registered" });
      return;
    }

    const id = `u${Date.now()}`;
    createUser.run(id, name, email, password);
    res.status(201).json({ success: true, user: { id, name, email } });
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = findUserByEmail.get(email) as { id: string; name: string; email: string; password: string } | undefined;
    if (!user || user.password !== password) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  });

  // API Routes
  app.get("/api/courses", (req, res) => {
    const courses = db.prepare("SELECT * FROM courses").all();
    const result = courses.map((course: any) => {
      const lessons = db.prepare("SELECT * FROM lessons WHERE course_id = ?").all(course.id);
      return { ...course, lessonList: lessons };
    });
    res.json(result);
  });

  app.get("/api/notes", (req, res) => {
    const notes = db.prepare("SELECT * FROM notes").all();
    res.json(notes);
  });

  app.get("/api/quizzes", (req, res) => {
    const quizzes = db.prepare("SELECT * FROM quizzes").all();
    const result = quizzes.map((q: any) => {
      const questions = db.prepare("SELECT * FROM questions WHERE quiz_id = ?").all(q.id);
      return {
        ...q,
        questions: questions.map((qn: any) => ({
          ...qn,
          options: JSON.parse(qn.options)
        }))
      };
    });
    res.json(result);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
