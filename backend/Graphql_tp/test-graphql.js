// Test simple para verificar que el schema GraphQL funciona
const { typeDefs } = require('./lib/graphql/schema.ts');
const { resolvers } = require('./lib/graphql/resolvers.ts');

console.log('=== TESTING GRAPHQL SCHEMA ===');
console.log('\nType Defs loaded:', !!typeDefs);
console.log('Resolvers loaded:', !!resolvers);

if (resolvers && resolvers.Query) {
  console.log('\nQuery resolvers available:');
  Object.keys(resolvers.Query).forEach(key => {
    console.log(`  - ${key}`);
  });
}

if (resolvers && resolvers.Mutation) {
  console.log('\nMutation resolvers available:');
  Object.keys(resolvers.Mutation).forEach(key => {
    console.log(`  - ${key}`);
  });
}

// Test a simple query
try {
  const totalReservas = resolvers.Query.totalReservas();
  console.log('\n✅ Test Query (totalReservas):', totalReservas);
} catch (error) {
  console.error('\n❌ Error in test query:', error.message);
}
