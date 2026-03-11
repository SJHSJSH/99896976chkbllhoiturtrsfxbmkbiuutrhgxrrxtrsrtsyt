# Google Apps Script Setup

## 1. Open Apps Script from your Google Sheet

1. Open the Google Sheet
2. Go to `Extensions > Apps Script`
3. Replace the default code with `apps-script/Code.gs`
4. Save the project

The script now auto-creates all required tabs and headers.
You can also run `initializeSheets()` once manually from the Apps Script editor.

## 2. Auto-created headers

### `Users`
`id | name | email | password`

### `Courses`
`id | title | lessons | image | price | oldPrice | type | category | access_code`

### `Lessons`
`id | course_id | title | duration | note_content | note_url | video_url`

### `Notes`
`id | title | lessons | category | type | url | content`

### `Quizzes`
`id | topic | type`

### `Questions`
`id | quiz_id | text | options | correctAnswer | explanation`

`options` should be stored as JSON, for example:
`["Option 1","Option 2","Option 3","Option 4"]`

## Sheet meaning

- `type`:
  - use `free` or `premium`
- `access_code`:
  - only needed for premium courses
- `url` in `Notes`:
  - use a PDF/view/share URL if you want the note to open from a hosted file
- `note_url` in `Lessons`:
  - optional hosted note link for lesson-wise notes
- `video_url` in `Lessons`:
  - use embeddable YouTube/video URLs

## 3. Deploy as web app

1. Click `Deploy > New deployment`
2. Choose `Web app`
3. Execute as: `Me`
4. Who has access: `Anyone`
5. Deploy and copy the web app URL

## 4. Connect frontend

Create a `.env` file in the project root:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-web-app-id/exec
```

Then restart the frontend/dev server.

## 5. Supported actions

### GET
- `?resource=courses`
- `?resource=notes`
- `?resource=quizzes`

### POST
- `action=login`
- `action=signup`
- `action=verifyCourseAccess`
- `action=updateCourseAccess`
- `action=createCourse`
- `action=updateCourse`
- `action=deleteCourse`
- `action=createLesson`
- `action=updateLesson`
- `action=deleteLesson`
- `action=createNote`
- `action=updateNote`
- `action=deleteNote`
- `action=createQuiz`
- `action=updateQuiz`
- `action=deleteQuiz`
- `action=createQuestion`
- `action=updateQuestion`
- `action=deleteQuestion`

For POST requests, send JSON in the request body.
