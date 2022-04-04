import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /* Function that is called when the user is registering, it takes in the entered email, password and name and creates a user 
    in the authentication management and if successful, then adds the user to the User table of the DB.
  */
  async userRegister(
    userEmail: string,
    userPass: string,
    userName: string,
  ): Promise<User> {
    const { user, error } = await supabase.auth.api.createUser({
      email: userEmail,
      password: userPass,
      email_confirm: true,
    });
    if (error) {
      throw new HttpException(
        {
          status: error.status,
          error: error.message,
        },
        error.status,
      );
    }
    return this.prisma.user.create({
      data: {
        id: user.id,
        email: userEmail,
        name: userName,
      },
    });
  }

  /* Function that is called when the user is logging in, it takes in the entered email and password and signs the user in, 
    in the authentication management and if successful, returns the signed in user's information retrieved from the User table of the DB.
  */
  async userLogin(userEmail: string, userPass: string): Promise<User> {
    const { user, error } = await supabase.auth.signIn({
      email: userEmail,
      password: userPass,
    });
    if (error) {
      throw new HttpException(
        {
          status: error.status,
          error: error.message,
        },
        error.status,
      );
    }
    return this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
  }

  // Function that is called when the user is logging out, it takes in the entered email and password and signs the user out.
  async userLogout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new HttpException(
        {
          status: error.status,
          error: error.message,
        },
        error.status,
      );
    }
  }
}
