CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO items (name, description) VALUES 
  ('Item 1', 'This is the first item'),
  ('Item 2', 'This is the second item'),
  ('Item 3', 'This is the third item'); 