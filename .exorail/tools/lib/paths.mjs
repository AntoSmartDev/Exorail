import path from 'node:path';

export function resolveRepositoryPath(repositoryRoot, relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`path must be repository-relative: ${relativePath}`);
  }

  const root = path.resolve(repositoryRoot);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`path escapes repository root: ${relativePath}`);
  }

  return resolved;
}

export function toRepositoryRelative(repositoryRoot, absolutePath) {
  const root = path.resolve(repositoryRoot);
  const resolved = path.resolve(absolutePath);
  const relative = path.relative(root, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`path is outside repository root: ${absolutePath}`);
  }

  return relative.split(path.sep).join('/');
}
