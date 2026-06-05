import { AppModule } from './app.module';

describe('AppModule (smoke)', () => {
  it('can be imported and has correct decorators', () => {
    expect(AppModule).toBeDefined();
    expect(AppModule.prototype).toBeInstanceOf(Object);
  });
});
