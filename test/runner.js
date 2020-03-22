const env = jasmine.getEnv();
const reporter = new jasmine.TapReporter();
env.addReporter(reporter);
env.execute();
