module.exports = {
    type: `handle`,
    func: (_e, arg) => require(`../../authentication`).getToken(arg)
}