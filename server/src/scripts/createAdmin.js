import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { hashPassword, isValidPassword, PASSWORD_POLICY_MESSAGE } from '../utils/password.js';
import { normalizeEmail, normalizeName } from '../utils/validation.js';

function askWithReadline(rl, question) {
  return new Promise((resolveAnswer, reject) => {
    const onInterrupt = () => {
      rl.removeListener('SIGINT', onInterrupt);
      reject(new Error('Input cancelled.'));
    };
    rl.question(question, answer => {
      rl.removeListener('SIGINT', onInterrupt);
      resolveAnswer(answer.trim());
    });
    rl.once('SIGINT', onInterrupt);
  });
}

function askTerminal(input, output, question, hidden = false) {
  return new Promise((resolveAnswer, reject) => {
    let value = '';
    const wasRaw = input.isRaw;
    const onData = chunk => {
      const character = chunk.toString('utf8');
      if (character === '\u0003') {
        cleanup();
        reject(new Error('Input cancelled.'));
      } else if (character === '\r' || character === '\n') {
        cleanup();
        output.write('\n');
        resolveAnswer(hidden ? value : value.trim());
      } else if (character === '\u007f' || character === '\b') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          output.write('\b \b');
        }
      } else {
        value += character;
        output.write(hidden ? '*' : character);
      }
    };
    const cleanup = () => {
      input.removeListener('data', onData);
      if (input.isTTY) input.setRawMode(Boolean(wasRaw));
    };

    output.write(question);
    input.setRawMode(true);
    input.on('data', onData);
  });
}

export async function createAdmin({ input = process.stdin, output = process.stdout } = {}) {
  const rl = input.isTTY ? null : readline.createInterface({ input, output });
  const ask = (question, hidden = false) => rl
    ? askWithReadline(rl, question)
    : askTerminal(input, output, question, hidden);
  try {
    const name = normalizeName(await ask('Admin name: '));
    const email = normalizeEmail(await ask('Admin email: '));
    const password = await ask('Admin password: ', true);

    if (!name) throw new Error('Admin name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid admin email is required.');
    if (!isValidPassword(password)) throw new Error(PASSWORD_POLICY_MESSAGE);

    if (await User.exists({ role: 'ADMIN' })) {
      throw new Error('An Admin account already exists. Bootstrap refused.');
    }
    if (await User.exists({ email })) {
      throw new Error('That email is already registered. Bootstrap refused.');
    }

    await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    output.write('Admin account created successfully.\n');
  } finally {
    rl?.close();
    if (input.isTTY && input.isRaw) input.setRawMode(false);
  }
}

async function main() {
  try {
    await connectDatabase();
    await createAdmin();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
