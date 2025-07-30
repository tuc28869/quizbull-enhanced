const axios = require('axios');

// Generate questions using AI service
exports.generateQuestions = async (req, res) => {
  try {
    const { certification } = req.body;
    
    if (!certification) {
      return res.status(400).json({ message: 'Certification type required' });
    }

    console.log(`Generating questions for: ${certification}`);

    // Call the AI service
    const aiResponse = await axios.post('http://localhost:5000/generate-quiz', {
      certification: certification
    }, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!aiResponse.data || !aiResponse.data.questions) {
      throw new Error('Invalid response from AI service');
    }

    console.log(`Successfully generated ${aiResponse.data.questions.length} questions`);

    res.json({
      questions: aiResponse.data.questions,
      count: aiResponse.data.questions.length
    });

  } catch (error) {
    console.error('Question generation error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: 'AI service unavailable. Please ensure the AI server is running on port 5000.',
        error: 'Service unavailable'
      });
    }

    if (error.response?.status === 500) {
      return res.status(500).json({ 
        message: 'AI service error. Please try again.',
        error: 'AI generation failed'
      });
    }

    res.status(500).json({ 
      message: 'Failed to generate questions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get quiz types (existing function - keeping it as is)
exports.getQuizTypes = async (req, res) => {
  try {
    // This would typically come from your database
    const quizTypes = [
      { id: 1, name: 'AWS Cloud Practitioner', displayName: 'AWS Cloud Practitioner' },
      { id: 2, name: 'CompTIA Security+', displayName: 'CompTIA Security+' },
      { id: 3, name: 'Microsoft Azure Fundamentals', displayName: 'Microsoft Azure Fundamentals' },
      { id: 4, name: 'Google Cloud Associate', displayName: 'Google Cloud Associate' },
      { id: 5, name: 'Cisco CCNA', displayName: 'Cisco CCNA' }
    ];
    
    res.json(quizTypes);
  } catch (error) {
    console.error('Error fetching quiz types:', error);
    res.status(500).json({ message: 'Failed to fetch quiz types' });
  }
};

// Start quiz session (existing function - keeping it as is)
exports.startSession = async (req, res) => {
  try {
    const { quiz_type_id, mode } = req.body;
    
    if (!quiz_type_id || !mode) {
      return res.status(400).json({ message: 'Quiz type and mode are required' });
    }

    // Generate a simple session ID
    const session_id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      session_id: session_id,
      quiz_type_id: quiz_type_id,
      mode: mode,
      started_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Failed to start quiz session' });
  }
};