// ...existing code...
function error(error: any) {
  // ...existing code...
  if (error && error.message) {
    console.error('Error:', error.message);
  } else {
    console.error('Error:', error);
  }

  if (error && error.data && error.data.method === 'PUBLIC_GetNode') {
    const info = error.data.info;
    if (info) {
      console.error('Info:', info);
    } else {
      console.error('Info is undefined');
    }
  }
  // ...existing code...
}
// ...existing code...
