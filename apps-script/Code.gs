const SHEET_NAMES = {
  users: 'Users',
  enrollments: 'Enrollments',
  courses: 'Courses',
  lessons: 'Lessons',
  notes: 'Notes',
  quizzes: 'Quizzes',
  questions: 'Questions',
};

const SHEET_HEADERS = {
  Users: ['id', 'name', 'email', 'password'],
  Enrollments: ['id', 'user_id', 'course_id', 'granted_at'],
  Courses: ['id', 'title', 'lessons', 'image', 'price', 'oldPrice', 'type', 'category', 'access_code'],
  Lessons: ['id', 'course_id', 'title', 'duration', 'note_content', 'note_url', 'video_url'],
  Notes: ['id', 'title', 'lessons', 'category', 'type', 'url', 'content'],
  Quizzes: ['id', 'topic', 'type'],
  Questions: ['id', 'quiz_id', 'text', 'options', 'correctAnswer', 'explanation'],
};

function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_HEADERS).forEach(function(sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    ensureHeaders_(sheet, SHEET_HEADERS[sheetName]);
  });

  return jsonOutput({
    success: true,
    message: 'Sheets initialized successfully',
  });
}

function doGet(e) {
  try {
    ensureAppSheets_();
    const resource = (e && e.parameter && e.parameter.resource) || '';

    switch (resource) {
      case 'users':
        return jsonOutput(getUsers_());
      case 'userAccess':
        return jsonOutput(getUserAccess_(e.parameter.userId));
      case 'courses':
        return jsonOutput(getCourses_());
      case 'notes':
        return jsonOutput(getNotes_());
      case 'quizzes':
        return jsonOutput(getQuizzes_());
      default:
        return jsonOutput({
          success: false,
          message: 'Unsupported resource',
        });
    }
  } catch (error) {
    return jsonOutput({
      success: false,
      message: error.message || 'Unexpected error',
    });
  }
}

function doPost(e) {
  try {
    ensureAppSheets_();
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action || '';

    switch (action) {
      case 'login':
        return jsonOutput(login_(body));
      case 'signup':
        return jsonOutput(signup_(body));
      case 'grantCourseAccess':
        return jsonOutput(grantCourseAccess_(body));
      case 'revokeCourseAccess':
        return jsonOutput(revokeCourseAccess_(body));
      case 'verifyCourseAccess':
        return jsonOutput(verifyCourseAccess_(body));
      case 'updateCourseAccess':
        return jsonOutput(updateCourseAccess_(body));
      case 'createCourse':
        return jsonOutput(createCourse_(body));
      case 'updateCourse':
        return jsonOutput(updateCourse_(body));
      case 'deleteCourse':
        return jsonOutput(deleteCourse_(body));
      case 'createLesson':
        return jsonOutput(createLesson_(body));
      case 'updateLesson':
        return jsonOutput(updateLesson_(body));
      case 'deleteLesson':
        return jsonOutput(deleteLesson_(body));
      case 'createNote':
        return jsonOutput(createNote_(body));
      case 'updateNote':
        return jsonOutput(updateNote_(body));
      case 'deleteNote':
        return jsonOutput(deleteNote_(body));
      case 'createQuiz':
        return jsonOutput(createQuiz_(body));
      case 'updateQuiz':
        return jsonOutput(updateQuiz_(body));
      case 'deleteQuiz':
        return jsonOutput(deleteQuiz_(body));
      case 'createQuestion':
        return jsonOutput(createQuestion_(body));
      case 'updateQuestion':
        return jsonOutput(updateQuestion_(body));
      case 'deleteQuestion':
        return jsonOutput(deleteQuestion_(body));
      default:
        return jsonOutput({
          success: false,
          message: 'Unsupported action',
        });
    }
  } catch (error) {
    return jsonOutput({
      success: false,
      message: error.message || 'Unexpected error',
    });
  }
}

function login_(body) {
  validateRequired_(body, ['email', 'password']);

  const users = readSheetObjects_(SHEET_NAMES.users);
  const matchedUser = users.find(function(user) {
    return normalize_(user.email) === normalize_(body.email) && String(user.password) === String(body.password);
  });

  if (!matchedUser) {
    return { success: false, message: 'Invalid credentials' };
  }

  return {
    success: true,
    user: {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      grantedCourseIds: getGrantedCourseIds_(matchedUser.id),
    },
  };
}

function signup_(body) {
  validateRequired_(body, ['name', 'email', 'password']);

  const usersSheet = getSheet_(SHEET_NAMES.users);
  const users = readSheetObjects_(SHEET_NAMES.users);
  const existingUser = users.find(function(user) {
    return normalize_(user.email) === normalize_(body.email);
  });

  if (existingUser) {
    return { success: false, message: 'Email already registered' };
  }

  const newUser = {
    id: createId_('u'),
    name: body.name,
    email: body.email,
    password: body.password,
  };

  appendObjectRow_(usersSheet, ['id', 'name', 'email', 'password'], newUser);

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      grantedCourseIds: [],
    },
  };
}

function createCourse_(body) {
  validateRequired_(body, ['title', 'lessons', 'image', 'price', 'oldPrice', 'type', 'category']);

  const course = {
    id: createId_('c'),
    title: body.title,
    lessons: body.lessons,
    image: body.image,
    price: body.price,
    oldPrice: body.oldPrice,
    type: body.type,
    category: body.category,
    access_code: body.access_code || '',
  };

  appendObjectRow_(getSheet_(SHEET_NAMES.courses), ['id', 'title', 'lessons', 'image', 'price', 'oldPrice', 'type', 'category', 'access_code'], course);
  return { success: true, course: course };
}

function updateCourse_(body) {
  validateRequired_(body, ['id', 'title', 'lessons', 'image', 'price', 'oldPrice', 'type', 'category']);

  updateRowById_(SHEET_NAMES.courses, body.id, {
    title: body.title,
    lessons: body.lessons,
    image: body.image,
    price: body.price,
    oldPrice: body.oldPrice,
    type: body.type,
    category: body.category,
    access_code: body.access_code || '',
  });

  return { success: true, message: 'Course updated' };
}

function deleteCourse_(body) {
  validateRequired_(body, ['id']);
  deleteRowById_(SHEET_NAMES.courses, body.id);
  deleteRowsByField_(SHEET_NAMES.lessons, 'course_id', body.id);
  return { success: true, message: 'Course deleted' };
}

function createLesson_(body) {
  validateRequired_(body, ['course_id', 'title', 'duration', 'video_url']);

  const lesson = {
    id: createId_('l'),
    course_id: body.course_id,
    title: body.title,
    duration: body.duration,
    note_content: body.note_content || '',
    note_url: body.note_url || '',
    video_url: body.video_url,
  };

  appendObjectRow_(getSheet_(SHEET_NAMES.lessons), ['id', 'course_id', 'title', 'duration', 'note_content', 'note_url', 'video_url'], lesson);
  return { success: true, lesson: lesson };
}

function updateLesson_(body) {
  validateRequired_(body, ['id', 'course_id', 'title', 'duration', 'video_url']);

  updateRowById_(SHEET_NAMES.lessons, body.id, {
    course_id: body.course_id,
    title: body.title,
    duration: body.duration,
    note_content: body.note_content || '',
    note_url: body.note_url || '',
    video_url: body.video_url,
  });

  return { success: true, message: 'Lesson updated' };
}

function deleteLesson_(body) {
  validateRequired_(body, ['id']);
  deleteRowById_(SHEET_NAMES.lessons, body.id);
  return { success: true, message: 'Lesson deleted' };
}

function createNote_(body) {
  validateRequired_(body, ['title', 'lessons', 'category']);

  const note = {
    id: createId_('n'),
    title: body.title,
    lessons: body.lessons,
    category: body.category,
    type: body.type || 'free',
    url: body.url || '',
    content: body.content || '',
  };

  appendObjectRow_(getSheet_(SHEET_NAMES.notes), ['id', 'title', 'lessons', 'category', 'type', 'url', 'content'], note);
  return { success: true, note: note };
}

function updateNote_(body) {
  validateRequired_(body, ['id', 'title', 'lessons', 'category']);

  updateRowById_(SHEET_NAMES.notes, body.id, {
    title: body.title,
    lessons: body.lessons,
    category: body.category,
    type: body.type || 'free',
    url: body.url || '',
    content: body.content || '',
  });

  return { success: true, message: 'Note updated' };
}

function deleteNote_(body) {
  validateRequired_(body, ['id']);
  deleteRowById_(SHEET_NAMES.notes, body.id);
  return { success: true, message: 'Note deleted' };
}

function createQuiz_(body) {
  validateRequired_(body, ['topic']);

  const quiz = {
    id: createId_('q'),
    topic: body.topic,
    type: body.type || 'free',
  };

  appendObjectRow_(getSheet_(SHEET_NAMES.quizzes), ['id', 'topic', 'type'], quiz);
  return { success: true, quiz: quiz };
}

function updateQuiz_(body) {
  validateRequired_(body, ['id', 'topic']);

  updateRowById_(SHEET_NAMES.quizzes, body.id, {
    topic: body.topic,
    type: body.type || 'free',
  });

  return { success: true, message: 'Quiz updated' };
}

function deleteQuiz_(body) {
  validateRequired_(body, ['id']);
  deleteRowById_(SHEET_NAMES.quizzes, body.id);
  deleteRowsByField_(SHEET_NAMES.questions, 'quiz_id', body.id);
  return { success: true, message: 'Quiz deleted' };
}

function verifyCourseAccess_(body) {
  validateRequired_(body, ['courseId', 'accessCode']);

  const courses = readSheetObjects_(SHEET_NAMES.courses);
  const course = courses.find(function(item) {
    return String(item.id) === String(body.courseId);
  });

  if (!course) {
    return { success: false, message: 'Course not found' };
  }

  if (String(course.type).toLowerCase() === 'free') {
    return { success: true };
  }

  if (String(course.access_code || '').trim().toUpperCase() !== String(body.accessCode || '').trim().toUpperCase()) {
    return { success: false, message: 'Invalid access code' };
  }

  if (body.userId) {
    ensureEnrollment_(body.userId, body.courseId);
  }

  return { success: true };
}

function grantCourseAccess_(body) {
  validateRequired_(body, ['userId', 'courseId']);
  ensureEnrollment_(body.userId, body.courseId);
  return { success: true, message: 'Course access granted' };
}

function revokeCourseAccess_(body) {
  validateRequired_(body, ['userId', 'courseId']);
  deleteEnrollment_(body.userId, body.courseId);
  return { success: true, message: 'Course access revoked' };
}

function updateCourseAccess_(body) {
  validateRequired_(body, ['courseId', 'accessCode']);

  const sheet = getSheet_(SHEET_NAMES.courses);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { success: false, message: 'No courses available' };
  }

  const headers = values[0];
  const idIndex = headers.indexOf('id');
  const accessIndex = headers.indexOf('access_code');

  for (var row = 1; row < values.length; row++) {
    if (String(values[row][idIndex]) === String(body.courseId)) {
      sheet.getRange(row + 1, accessIndex + 1).setValue(body.accessCode);
      return { success: true, message: 'Access code updated' };
    }
  }

  return { success: false, message: 'Course not found' };
}

function createQuestion_(body) {
  validateRequired_(body, ['quiz_id', 'text', 'options', 'correctAnswer', 'explanation']);

  const question = {
    id: createId_('qn'),
    quiz_id: body.quiz_id,
    text: body.text,
    options: JSON.stringify(body.options),
    correctAnswer: body.correctAnswer,
    explanation: body.explanation,
  };

  appendObjectRow_(getSheet_(SHEET_NAMES.questions), ['id', 'quiz_id', 'text', 'options', 'correctAnswer', 'explanation'], question);
  return { success: true, question: question };
}

function updateQuestion_(body) {
  validateRequired_(body, ['id', 'quiz_id', 'text', 'options', 'correctAnswer', 'explanation']);

  updateRowById_(SHEET_NAMES.questions, body.id, {
    quiz_id: body.quiz_id,
    text: body.text,
    options: JSON.stringify(body.options),
    correctAnswer: body.correctAnswer,
    explanation: body.explanation,
  });

  return { success: true, message: 'Question updated' };
}

function deleteQuestion_(body) {
  validateRequired_(body, ['id']);
  deleteRowById_(SHEET_NAMES.questions, body.id);
  return { success: true, message: 'Question deleted' };
}

function getCourses_() {
  const courses = readSheetObjects_(SHEET_NAMES.courses);
  const lessons = readSheetObjects_(SHEET_NAMES.lessons);

  return courses.map(function(course) {
    return Object.assign({}, course, {
      lessons: Number(course.lessons || 0),
      price: Number(course.price || 0),
      oldPrice: Number(course.oldPrice || 0),
      access_code: undefined,
      lessonList: lessons.filter(function(lesson) {
        return String(lesson.course_id) === String(course.id);
      }),
    });
  });
}

function getUsers_() {
  const users = readSheetObjects_(SHEET_NAMES.users);
  return users.map(function(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      grantedCourseIds: getGrantedCourseIds_(user.id),
    };
  });
}

function getUserAccess_(userId) {
  if (!userId) {
    return [];
  }
  return getGrantedCourseIds_(userId);
}

function getNotes_() {
  return readSheetObjects_(SHEET_NAMES.notes).map(function(note) {
    return Object.assign({}, note, {
      lessons: Number(note.lessons || 0),
    });
  });
}

function getQuizzes_() {
  const quizzes = readSheetObjects_(SHEET_NAMES.quizzes);
  const questions = readSheetObjects_(SHEET_NAMES.questions);

  return quizzes.map(function(quiz) {
    return Object.assign({}, quiz, {
      questions: questions
        .filter(function(question) {
          return String(question.quiz_id) === String(quiz.id);
        })
        .map(function(question) {
          return {
            id: question.id,
            quiz_id: question.quiz_id,
            text: question.text,
            options: parseOptions_(question.options),
            correctAnswer: Number(question.correctAnswer || 0),
            explanation: question.explanation || '',
          };
        }),
    });
  });
}

function parseOptions_(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value).split('|').map(function(item) {
      return item.trim();
    }).filter(Boolean);
  }
}

function getSheet_(name) {
  ensureAppSheets_();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  return sheet;
}

function readSheetObjects_(name) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function(header) {
    return String(header).trim();
  });

  return values.slice(1).filter(function(row) {
    return row.some(function(cell) { return cell !== ''; });
  }).map(function(row) {
    const item = {};
    headers.forEach(function(header, index) {
      item[header] = row[index];
    });
    return item;
  });
}

function appendObjectRow_(sheet, headers, item) {
  ensureHeaders_(sheet, headers);
  const row = headers.map(function(header) {
    return item[header] !== undefined ? item[header] : '';
  });
  sheet.appendRow(row);
}

function updateRowById_(sheetName, id, updates) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('No data available in ' + sheetName);
  }

  const headers = values[0];
  const idIndex = headers.indexOf('id');
  for (var row = 1; row < values.length; row++) {
    if (String(values[row][idIndex]) === String(id)) {
      headers.forEach(function(header, index) {
        if (Object.prototype.hasOwnProperty.call(updates, header)) {
          sheet.getRange(row + 1, index + 1).setValue(updates[header]);
        }
      });
      return;
    }
  }

  throw new Error(sheetName + ' item not found');
}

function deleteRowById_(sheetName, id) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('No data available in ' + sheetName);
  }

  const headers = values[0];
  const idIndex = headers.indexOf('id');
  for (var row = values.length - 1; row >= 1; row--) {
    if (String(values[row][idIndex]) === String(id)) {
      sheet.deleteRow(row + 1);
      return;
    }
  }

  throw new Error(sheetName + ' item not found');
}

function deleteRowsByField_(sheetName, fieldName, value) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headers = values[0];
  const fieldIndex = headers.indexOf(fieldName);
  if (fieldIndex === -1) return;

  for (var row = values.length - 1; row >= 1; row--) {
    if (String(values[row][fieldIndex]) === String(value)) {
      sheet.deleteRow(row + 1);
    }
  }
}

function getGrantedCourseIds_(userId) {
  const enrollments = readSheetObjects_(SHEET_NAMES.enrollments);
  return enrollments
    .filter(function(item) {
      return String(item.user_id) === String(userId);
    })
    .map(function(item) {
      return String(item.course_id);
    });
}

function ensureEnrollment_(userId, courseId) {
  const enrollments = readSheetObjects_(SHEET_NAMES.enrollments);
  const existing = enrollments.find(function(item) {
    return String(item.user_id) === String(userId) && String(item.course_id) === String(courseId);
  });

  if (existing) {
    return;
  }

  appendObjectRow_(
    getSheet_(SHEET_NAMES.enrollments),
    SHEET_HEADERS.Enrollments,
    {
      id: createId_('en'),
      user_id: userId,
      course_id: courseId,
      granted_at: new Date().toISOString(),
    }
  );
}

function deleteEnrollment_(userId, courseId) {
  const sheet = getSheet_(SHEET_NAMES.enrollments);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headers = values[0];
  const userIndex = headers.indexOf('user_id');
  const courseIndex = headers.indexOf('course_id');

  for (var row = values.length - 1; row >= 1; row--) {
    if (String(values[row][userIndex]) === String(userId) && String(values[row][courseIndex]) === String(courseId)) {
      sheet.deleteRow(row + 1);
    }
  }
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const missingHeaders = headers.some(function(header, index) {
    return String(currentHeaders[index] || '') !== header;
  });

  if (missingHeaders) {
    sheet.clear();
    sheet.appendRow(headers);
  }
}

function ensureAppSheets_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_HEADERS).forEach(function(sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }
    ensureHeaders_(sheet, SHEET_HEADERS[sheetName]);
  });
}

function validateRequired_(body, fields) {
  fields.forEach(function(field) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new Error(field + ' is required');
    }
  });
}

function normalize_(value) {
  return String(value || '').trim().toLowerCase();
}

function createId_(prefix) {
  return prefix + new Date().getTime();
}

function jsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
