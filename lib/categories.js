const debug = require('debug')('log4js:categories');
const configuration = require('./configuration');
const levels = require('./levels');
const appenders = require('./appenders');

const categories = new Map();

/**
 * Add inherited config to this category.  That includes extra appenders from parent,
 * and level, if none is set on this category.
 * This is recursive, so each parent also gets loaded with inherited appenders.
 * Inheritance is blocked if a category has inherit=false
 * @param  {*} config
 * @param  {*} category the child category
 * @param  {string} categoryName dotted path to category
 * @return {void}
 */
function inheritFromParent(config, category, categoryName) {
  if (category.inherit === false) return;
  const lastDotIndex = categoryName.lastIndexOf('.');
  if (lastDotIndex < 0) return; // category is not a child
  const parentCategoryName = categoryName.substring(0, lastDotIndex);
  let parentCategory = config.categories[parentCategoryName];


  if (!parentCategory) {
    // parent is missing, so implicitly create it, so that it can inherit from its parents
    parentCategory = { inherit: true, appenders: [] };
  }

  // make sure parent has had its inheritance taken care of before pulling its properties to this child
  inheritFromParent(config, parentCategory, parentCategoryName);

  // if the parent is not in the config (because we just created it above),
  // and it inherited a valid configuration, add it to config.categories
  if (!config.categories[parentCategoryName]
    && parentCategory.appenders
    && parentCategory.appenders.length
    && parentCategory.level) {
    config.categories[parentCategoryName] = parentCategory;
  }

  category.appenders = category.appenders || [];
  category.level = category.level || parentCategory.level;

  // merge in appenders from parent (parent is already holding its inherited appenders)
  parentCategory.appenders.forEach((ap) => {
    if (!category.appenders.includes(ap)) {
      category.appenders.push(ap);
    }
  });
  category.parent = parentCategory;
}


/**
 * Walk all categories in the config, and pull down any configuration from parent to child.
 * This includes inherited appenders, and level, where level is not set.
 * Inheritance is skipped where a category has inherit=false.
 * @param  {*} config
 */
function addCategoryInheritance(config) {
  if (!config.categories) return;
  const categoryNames = Object.keys(config.categories);
  categoryNames.forEach((name) => {
    const category = config.categories[name];
    // add inherited appenders and level to this category
    inheritFromParent(config, category, name);
  });
}

configuration.addPreProcessingListener(config => addCategoryInheritance(config));

configuration.addListener((config) => {
  configuration.throwExceptionIf(
    config,
    configuration.not(configuration.anObject(config.categories)),
    'must have a property "categories" of type object.'
  );

  const categoryNames = Object.keys(config.categories);
  configuration.throwExceptionIf(
    config,
    configuration.not(categoryNames.length),
    'must define at least one category.'
  );

  categoryNames.forEach((name) => {
    const category = config.categories[name];
    configuration.throwExceptionIf(
      config,
      [
        configuration.not(category.appenders),
        configuration.not(category.level)
      ],
      `category "${name}" is not valid (must be an object with properties "appenders" and "level")`
    );

    configuration.throwExceptionIf(
      config,
      configuration.not(Array.isArray(category.appenders)),
      `category "${name}" is not valid (appenders must be an array of appender names)`
    );

    configuration.throwExceptionIf(
      config,
      configuration.not(category.appenders.length),
      `category "${name}" is not valid (appenders must contain at least one appender name)`
    );

    if (Object.prototype.hasOwnProperty.call(category, 'enableCallStack')) {
      configuration.throwExceptionIf(
        config,
        typeof category.enableCallStack !== 'boolean',
        `category "${name}" is not valid (enableCallStack must be boolean type)`
      );
    }

    category.appenders.forEach((appender) => {
      configuration.throwExceptionIf(
        config,
        configuration.not(appenders.get(appender)),
        `category "${name}" is not valid (appender "${appender}" is not defined)`
      );
    });

    configuration.throwExceptionIf(
      config,
      configuration.not(levels.getLevel(category.level)),
      `category "${name}" is not valid (level "${category.level}" not recognised;`
      + ` valid levels are ${levels.levels.join(', ')})`
    );
  });

  configuration.throwExceptionIf(
    config,
    configuration.not(config.categories.default),
    'must define a "default" category.'
  );
});

const setup = (config) => {
  categories.clear();

  const categoryNames = Object.keys(config.categories);
  categoryNames.forEach((name) => {
    const category = config.categories[name];
    const categoryAppenders = [];
    category.appenders.forEach((appender) => {
      categoryAppenders.push(appenders.get(appender));
      debug(`Creating category ${name}`);
      categories.set(
        name,
        {
          appenders: categoryAppenders,
          level: levels.getLevel(category.level),
          enableCallStack: category.enableCallStack || false
        }
      );
    });
  });
};

setup({ categories: { default: { appenders: ['out'], level: 'OFF' } } });
configuration.addListener(setup);

const configForCategory = (category) => {
  debug(`configForCategory: searching for config for ${category}`);
  if (categories.has(category)) {
    debug(`configForCategory: ${category} exists in config, returning it`);
    return categories.get(category);
  }
  if (category.indexOf('.') > 0) {
    debug(`configForCategory: ${category} has hierarchy, searching for parents`);
    return configForCategory(category.substring(0, category.lastIndexOf('.')));
  }
  debug('configForCategory: returning config for default category');
  return configForCategory('default');
};

const appendersForCategory = category => configForCategory(category).appenders;
const getLevelForCategory = category => configForCategory(category).level;

const setLevelForCategory = (category, level) => {
  let categoryConfig = categories.get(category);
  debug(`setLevelForCategory: found ${categoryConfig} for ${category}`);
  if (!categoryConfig) {
    const sourceCategoryConfig = configForCategory(category);
    debug('setLevelForCategory: no config found for category, '
      + `found ${sourceCategoryConfig} for parents of ${category}`);
    categoryConfig = { appenders: sourceCategoryConfig.appenders };
  }
  categoryConfig.level = level;
  categories.set(category, categoryConfig);
};

const getEnableCallStackForCategory = category => configForCategory(category).enableCallStack === true;
const setEnableCallStackForCategory = (category, useCallStack) => {
  configForCategory(category).enableCallStack = useCallStack;
};

module.exports = {
  appendersForCategory,
  getLevelForCategory,
  setLevelForCategory,
  getEnableCallStackForCategory,
  setEnableCallStackForCategory,
};
