// The rest of the app depends on this, never on a specific provider.
// Switching provider later means writing one new class.
export abstract class EmailSender {
  abstract sendLoginCode(to: string, code: string): Promise<void>;
}
