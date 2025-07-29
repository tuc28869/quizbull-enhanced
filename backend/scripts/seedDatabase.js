// backend/scripts/seedDatabase.js
const { sequelize, User, QuizType, Question, UserProgress } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Sample FINRA quiz questions organized by exam type
const sampleQuestions = {
  SIE: [
    {
      questionText: "What does the M in MSRB stand for?",
      optionA: "Municipal",
      optionB: "Market",
      optionC: "Money",
      optionD: "Margin",
      correctAnswer: "A",
      explanation: "MSRB stands for Municipal Securities Rulemaking Board, which regulates municipal bond dealers.",
      topic: "Regulatory Bodies",
      difficultyLevel: 2
    },
    {
      questionText: "Which of the following best describes a callable bond?",
      optionA: "A bond that can be sold back to the issuer at any time",
      optionB: "A bond that the issuer can redeem before maturity",
      optionC: "A bond with variable interest rates",
      optionD: "A bond backed by municipal taxes",
      correctAnswer: "B",
      explanation: "A callable bond gives the issuer the right to redeem the bond before its maturity date, typically when interest rates fall.",
      topic: "Fixed Income Securities",
      difficultyLevel: 2
    }
  ],
  "Series 7": [
    {
      questionText: "The maximum contribution to a traditional IRA for someone under 50 in 2024 is:",
      optionA: "$6,000",
      optionB: "$6,500",
      optionC: "$7,000",
      optionD: "$7,500",
      correctAnswer: "C",
      explanation: "For 2024, the maximum IRA contribution for those under 50 is $7,000, with an additional $1,000 catch-up contribution for those 50 and older.",
      topic: "Retirement Plans",
      difficultyLevel: 1
    },
    {
      questionText: "Which order type guarantees execution but not price?",
      optionA: "Limit order",
      optionB: "Stop order",
      optionC: "Market order",
      optionD: "Stop-limit order",
      correctAnswer: "C",
      explanation: "A market order guarantees execution at the best available price but does not guarantee a specific price.",
      topic: "Trading and Securities Markets",
      difficultyLevel: 2
    }
  ],
  "Series 63": [
    {
      questionText: "Under the Uniform Securities Act, which of the following is NOT considered a security?",
      optionA: "Certificate of deposit issued by a bank",
      optionB: "Investment contract",
      optionC: "Stock option",
      optionD: "Commodity futures contract",
      correctAnswer: "A",
      explanation: "Bank certificates of deposit are specifically excluded from the definition of securities under most state laws.",
      topic: "Securities Law",
      difficultyLevel: 3
    }
  ],
  "Series 65": [
    {
      questionText: "According to Modern Portfolio Theory, the efficient frontier represents:",
      optionA: "The maximum return for any level of risk",
      optionB: "The minimum risk for any level of return",
      optionC: "Both maximum return for given risk and minimum risk for given return",
      optionD: "The correlation between different asset classes",
      correctAnswer: "C",
      explanation: "The efficient frontier shows portfolios that offer the highest expected return for each level of risk, or equivalently, the lowest risk for each level of expected return.",
      topic: "Portfolio Management Theory",
      difficultyLevel: 3
    },
    {
      questionText: "Which of the following is a fiduciary obligation of an investment adviser?",
      optionA: "Guaranteeing investment returns",
      optionB: "Acting in the client's best interest",
      optionC: "Providing investment advice only during market hours",
      optionD: "Maintaining a minimum account balance",
      correctAnswer: "B",
      explanation: "Investment advisers have a fiduciary duty to act in their clients' best interests at all times.",
      topic: "Fiduciary Responsibilities",
      difficultyLevel: 2
    }
  ],
  "Series 66": [
    {
      questionText: "The Investment Advisers Act of 1940 applies to advisers that:",
      optionA: "Manage more than $100 million in assets",
      optionB: "Have more than 100 clients",
      optionC: "Operate across state lines",
      optionD: "All of the above",
      correctAnswer: "A",
      explanation: "The Investment Advisers Act of 1940 generally applies to advisers managing more than $100 million in assets under management.",
      topic: "Federal Securities Laws",
      difficultyLevel: 2
    }
  ],
  CFP: [
    {
      questionText: "Which tax-advantaged account allows for tax-free withdrawals in retirement?",
      optionA: "Traditional IRA",
      optionB: "401(k)",
      optionC: "Roth IRA",
      optionD: "SEP-IRA",
      correctAnswer: "C",
      explanation: "Roth IRA contributions are made with after-tax dollars, and qualified withdrawals in retirement are tax-free.",
      topic: "Retirement Planning",
      difficultyLevel: 1
    }
  ],
  CFA: [
    {
      questionText: "The Capital Asset Pricing Model (CAPM) assumes that:",
      optionA: "Markets are inefficient",
      optionB: "Investors are risk-seeking",
      optionC: "There are no transaction costs",
      optionD: "Information is asymmetric",
      correctAnswer: "C",
      explanation: "CAPM assumes perfect markets with no transaction costs, taxes, or restrictions on borrowing and lending.",
      topic: "Asset Pricing Models",
      difficultyLevel: 4
    }
  ]
};

// Quiz type configurations matching FINRA exam specifications
const quizTypes = [
  {
    name: "SIE",
    displayName: "Securities Industry Essentials",
    totalQuestions: 75,
    passingScore: 70,
    timeLimit: 105,
    description: "Entry-level exam covering basic securities industry knowledge"
  },
  {
    name: "Series 7",
    displayName: "General Securities Representative",
    totalQuestions: 125,
    passingScore: 72,
    timeLimit: 225,
    description: "Comprehensive exam for general securities representatives"
  },
  {
    name: "Series 63",
    displayName: "Uniform Securities Agent State Law",
    totalQuestions: 60,
    passingScore: 72,
    timeLimit: 75,
    description: "State securities law exam for agents"
  },
  {
    name: "Series 65",
    displayName: "Uniform Investment Adviser Law",
    totalQuestions: 130,
    passingScore: 72,
    timeLimit: 180,
    description: "Investment adviser representative qualification exam"
  },
  {
    name: "Series 66",
    displayName: "Uniform Combined State Law",
    totalQuestions: 100,
    passingScore: 75,
    timeLimit: 150,
    description: "Combined uniform securities agent and investment adviser law exam"
  },
  {
    name: "CFP",
    displayName: "Certified Financial Planner",
    totalQuestions: 170,
    passingScore: 60,
    timeLimit: 360,
    description: "Comprehensive financial planning certification exam"
  },
  {
    name: "CFA",
    displayName: "Chartered Financial Analyst Level 1",
    totalQuestions: 180,
    passingScore: 70,
    timeLimit: 360,
    description: "Investment analysis and portfolio management exam"
  }
];

async function seedDatabase() {
  try {
    console.log('🚀 Starting database synchronization...');
    
    // Sync database - creates tables if they don't exist
    await sequelize.sync({ force: true }); // Use { alter: true } for production to preserve data
    console.log('✅ Database synchronized successfully');

    console.log('📊 Seeding quiz types...');
    
    // Insert quiz types and get their IDs for foreign key relationships
    const createdQuizTypes = {};
    for (const quizType of quizTypes) {
      const created = await QuizType.create(quizType);
      createdQuizTypes[quizType.name] = created.id;
      console.log(`   ✓ Created quiz type: ${quizType.displayName}`);
    }

    console.log('❓ Seeding sample questions...');
    
    let totalQuestions = 0;
    // Insert sample questions for each quiz type
    for (const [quizTypeName, questions] of Object.entries(sampleQuestions)) {
      const quizTypeId = createdQuizTypes[quizTypeName];
      
      if (!quizTypeId) {
        console.log(`   ⚠️  Skipping questions for ${quizTypeName} - quiz type not found`);
        continue;
      }

      for (const question of questions) {
        await Question.create({
          ...question,
          quizTypeId: quizTypeId
        });
        totalQuestions++;
      }
      
      console.log(`   ✓ Added ${questions.length} questions for ${quizTypeName}`);
    }

    console.log('👤 Creating demo user account...');
    
    // Create a demo user for testing
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const demoUser = await User.create({
      username: 'demo_user',
      email: 'demo@quizbull.app',
      passwordHash: hashedPassword
    });

    console.log('📈 Initializing user progress records...');
    
    // Initialize progress records for the demo user
    for (const [quizTypeName, quizTypeId] of Object.entries(createdQuizTypes)) {
      await UserProgress.create({
        userId: demoUser.id,
        quizTypeId: quizTypeId,
        totalAttempts: 0,
        bestScore: 0,
        latestScore: 0,
        totalCorrect: 0,
        totalQuestions: 0
      });
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Quiz types created: ${quizTypes.length}`);
    console.log(`   • Questions created: ${totalQuestions}`);
    console.log(`   • Demo user: demo_user (password: demo123)`);
    console.log(`   • Progress records initialized: ${Object.keys(createdQuizTypes).length}`);
    
    console.log('\n🔗 Next steps:');
    console.log('   1. Start your Express server: npm run dev');
    console.log('   2. Test login with demo_user / demo123');
    console.log('   3. Use /api/quiz/types to see available exams');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Helper function to generate additional questions (for future expansion)
function generateAdditionalQuestions(quizType, count = 50) {
  const topics = {
    'SIE': ['Regulatory Bodies', 'Market Structure', 'Securities Types', 'Customer Accounts'],
    'Series 7': ['Investment Products', 'Trading', 'Customer Accounts', 'Regulatory Requirements'],
    'Series 65': ['Portfolio Management', 'Fiduciary Duties', 'Investment Analysis', 'Client Relations'],
    // Add more as needed
  };

  const questions = [];
  const relevantTopics = topics[quizType] || ['General Knowledge'];

  for (let i = 0; i < count; i++) {
    const topic = relevantTopics[i % relevantTopics.length];
    questions.push({
      questionText: `Sample ${quizType} question ${i + 1} about ${topic.toLowerCase()}`,
      optionA: "Option A",
      optionB: "Option B", 
      optionC: "Option C",
      optionD: "Option D",
      correctAnswer: ["A", "B", "C", "D"][i % 4],
      explanation: `This is a sample explanation for ${quizType} question ${i + 1}.`,
      topic: topic,
      difficultyLevel: (i % 3) + 1
    });
  }

  return questions;
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleQuestions, quizTypes };