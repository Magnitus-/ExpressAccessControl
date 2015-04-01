//Copyright (c) 2015 Eric Vallee <eric_vallee2003@yahoo.ca>
//MIT License: https://raw.githubusercontent.com/Magnitus-/ExpressAccessControl/master/License.txt

var GetMemberships = function(Req, Res) {
    var ToReturn = Req.session && Req.session.User && Req.session.User.Memberships ? Req.session.User.Memberships : [];
    return(ToReturn);
};

var LoggedIn = function(Req, Res) {
    return(Req.session&&Req.session.User);
};

function SetGetMemberships(NewGetter)
{
    GetMemberships = NewGetter;
}

function SetLoggedIn(NewChecker)
{
    LoggedIn = NewChecker;
}

function Authenticate(Req, Res, Groups, And)
{
    if(LoggedIn(Req, Res))
    {
        if(Groups)
        {
            var Operator = And ? 'every' : 'some';
            var Memberships = GetMemberships(Req, Res);
            return(Groups[Operator](function(Group, GroupIndex, GroupList) {
                return(Memberships.some(function(Membership, MembershipIndex, MembershipList) {
                    return(Membership==Group); 
                }));
            }));
        }
        else
        {
            return(true);
        }
    }
    
    return(false);
}

function AuthenticateRoute(Options)
{
    var Groups = [];
    var And = false
    var Not = false
    if(Array.isArray(Options))
    {
        Groups = Options;
    }
    else
    {
        Groups = Options && Options.Groups ? Options.Groups : null;
        And = Options && Options.And ? Options.And : false;
        Not = Options && Options.Not ? Options.Not : false;
    }
    return(function(Req, Res, Next) {
        var Authenticated = Authenticate(Req, Res, Groups, And);
        Authenticated = Not ? (!Authenticated) : Authenticated;
        if(Authenticated)
        {
            Next();
        }
        else
        {
            var Err = new Error();
            Err.Source = "ExpressAccessControl";
            Err.Type = "NoAccess";
            Next(Err);
        }
    });
}

module.exports = {'Authenticate': Authenticate, 'AuthenticateRoute': AuthenticateRoute, 'SetGetMemberships': SetGetMemberships, 'SetLoggedIn': SetLoggedIn};
