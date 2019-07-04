const Bitbucket = require('bitbucket');
const csvWriter = require('csv-write-stream');
const { login, password, repo, state } = require('minimist')(
  process.argv.slice(2)
);

const clientOptions = {
  baseUrl: 'https://api.bitbucket.org/2.0',
  headers: {},
  hideNotice: true,
  options: {
    timeout: 10 * 1000
  }
};
const bitbucket = new Bitbucket(clientOptions);
const [username, repo_slug] = repo.split('/');

const format = pr => ({
  id: pr.id,
  author: pr.author.nickname,
  link: pr.links.html.href,
  title: pr.title,
  source_branch: pr.source.branch.name,
  destination_branch: pr.destination.branch.name,
  state: pr.state,
  created_on: pr.created_on,
  updated_on: pr.updated_on,
  duration: Math.ceil(
    (+new Date(pr.updated_on) - new Date(pr.created_on)) / 1000
  )
});

const writer = csvWriter();
const write = data => data.values.map(format).map(d => writer.write(d));
const run = async () => {
  bitbucket.authenticate({
    type: 'basic',
    username: login,
    password
  });

  try {
    let { data } = await bitbucket.pullrequests.list({
      username,
      repo_slug,
      state,
      pagelen: 50
    });

    writer.pipe(process.stdout);
    write(data);

    while (bitbucket.hasNextPage(data)) {
      const { data: nextData } = await bitbucket.getNextPage(data);
      write(nextData);
      data = nextData;
    }
    writer.end();
  } catch (e) {
    console.error(e);
  }
};

run();
